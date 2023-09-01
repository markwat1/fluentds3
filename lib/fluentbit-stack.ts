import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2} from 'aws-cdk-lib';
import { Ec2Instance} from './ec2';
import { Eic } from './eic';
import { Vpc } from './vpc';
import * as fs from 'fs';
import * as pg from './passwordGenerator';

export class FluentbitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Virtual Private Cloud(VPC)
    const availabilityZones = ['ap-northeast-1c','ap-northeast-1a'];
    const vpc = new Vpc(this,'fluentbit-ec2',{
      availabilityZones: availabilityZones,
    });
    // Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'ec2-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
      securityGroupName:'ec2-sg',
    });
    const eicSecurityGroup = new ec2.SecurityGroup(this,'eic-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: false,
      securityGroupName:'eic-sg'
    })
    ec2SecurityGroup.addIngressRule(eicSecurityGroup,ec2.Port.tcp(22));
    eicSecurityGroup.addEgressRule(ec2SecurityGroup,ec2.Port.tcp(22));
    // EC2 Instances
    let instances:Ec2Instance[] = [];
    for(const az of availabilityZones){
      instances.push( new Ec2Instance(this,'ec2-' + az,{
        vpc: vpc.getVpc(),
        name:'ec2-' + az,
        availabilityZone: az,
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        instanceClass: ec2.InstanceClass.T4G,
        instanceSize: ec2.InstanceSize.NANO,
        ec2SecurityGroup: ec2SecurityGroup,
      }));
    }
    const userDataSource = fs.readFileSync('./lib/ud.sh','utf8');
    const pwg = new pg.PasswordGenerator();
    const defaultEscapeChars = '\\`"$';
    const dbPassword = pwg.generate({length:24});
    const replaceValues = {
      __SOURCE__:"destination",
    };

    const userDataScript = pg.replaceStrings(userDataSource,replaceValues);
    for(const instance of instances){
      instance.getInstance().addUserData(userDataScript);
    }
    // EIC
    new Eic(this,'eic',{
      securityGroupId:eicSecurityGroup.securityGroupId,
      subnetId:vpc.getVpc().selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds[0],
    });
  }
}
