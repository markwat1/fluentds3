import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2} from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

import { Ec2Instance} from './ec2';
import { Eic } from './eic';
import { Vpc } from './vpc';
import * as fs from 'fs';
import * as pg from './passwordGenerator';

export class FluentbitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Virtual Private Cloud(VPC)
    const fluentdPort = 24224;
    const availabilityZones = ['ap-northeast-1c'];
    const vpc = new Vpc(this,'fluentbit-ec2',{
      availabilityZones: availabilityZones,
    });
    // Security Group
    const senderSecurityGroup = new ec2.SecurityGroup(this, 'sender-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
      securityGroupName:'sender-sg',
    });
    const forwarderSecurityGroup = new ec2.SecurityGroup(this, 'forwarder-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
      securityGroupName:'forwarder-sg',
    });
    const eicSecurityGroup = new ec2.SecurityGroup(this,'eic-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: false,
      securityGroupName:'eic-sg'
    })
    senderSecurityGroup.addIngressRule(eicSecurityGroup,ec2.Port.tcp(22));
    eicSecurityGroup.addEgressRule(senderSecurityGroup,ec2.Port.tcp(22));
    forwarderSecurityGroup.addIngressRule(eicSecurityGroup,ec2.Port.tcp(22));
    eicSecurityGroup.addEgressRule(forwarderSecurityGroup,ec2.Port.tcp(22));
    // open ingress port for log forwarding 
    forwarderSecurityGroup.addIngressRule(senderSecurityGroup,ec2.Port.tcp(fluentdPort));
    forwarderSecurityGroup.addIngressRule(senderSecurityGroup,ec2.Port.udp(fluentdPort));
    // S3 bucket for log 
    const logBucket = new s3.Bucket(this,"LogBucket",{
      removalPolicy:cdk.RemovalPolicy.DESTROY,
    });
    // log store policy
    const s3PutObjectPolicyStatement = new iam.PolicyStatement({
      actions:['s3:PutObject','s3:GetObject','s3:GetObjectAttributes'],
      resources:[logBucket.bucketArn + '/*'],
      effect:iam.Effect.ALLOW,
    });
    const s3ListBucketPolicyStatement = new iam.PolicyStatement({
      actions:['s3:ListBucket'],
      resources:[logBucket.bucketArn],
      effect:iam.Effect.ALLOW,
    });
    // build forwarder
    const forwarder = new Ec2Instance(this,'forwarder' ,{
      vpc: vpc.getVpc(),
      name:'forwarder',
      availabilityZone: availabilityZones[0],
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      instanceClass: ec2.InstanceClass.T4G,
      instanceSize: ec2.InstanceSize.NANO,
      ec2SecurityGroup: forwarderSecurityGroup,
    })
    forwarder.getInstance().addToRolePolicy(s3PutObjectPolicyStatement);
    forwarder.getInstance().addToRolePolicy(s3ListBucketPolicyStatement);
    // setup forwarder userdata
    const forwarderUserDataSource = fs.readFileSync('./lib/ud/forwarder-ud.sh','utf8');
    const forwarderReplaceValues = {
      __LOG_BUCKET_NAME__: logBucket.bucketName,
      __FLUENTD_PORT__ : fluentdPort.toString(),
    };
    const forwarderUserDataScript = pg.replaceStrings(forwarderUserDataSource,forwarderReplaceValues);
    forwarder.getInstance().addUserData(forwarderUserDataScript);

    // build sender Instances
    let senders:Ec2Instance[] = [];
    for(const az of availabilityZones){
      senders.push( new Ec2Instance(this,'sender-' + az,{
        vpc: vpc.getVpc(),
        name:'sender-' + az,
        availabilityZone: az,
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        instanceClass: ec2.InstanceClass.T4G,
        instanceSize: ec2.InstanceSize.NANO,
        ec2SecurityGroup: senderSecurityGroup,
      }));
    }
    // setup sender userdata
    const senderUserDataSource = fs.readFileSync('./lib/ud/sender-ud.sh','utf8');
    // const pwg = new pg.PasswordGenerator();
    // const defaultEscapeChars = '\\`"$';
    // const dbPassword = pwg.generate({length:24});
    const senderReplaceValues = {
      __FORWARDER_IP_ADDRESS__: forwarder.getInstance().instancePrivateIp,
      __FLUENTD_PORT__ : fluentdPort.toString(),
    };
    const senderUserDataScript = pg.replaceStrings(senderUserDataSource,senderReplaceValues);
    for(const instance of senders){
      instance.getInstance().addUserData(senderUserDataScript);
    }
    // EIC
    new Eic(this,'eic',{
      securityGroupId:eicSecurityGroup.securityGroupId,
      subnetId:vpc.getVpc().selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds[0],
    });
  }
}
