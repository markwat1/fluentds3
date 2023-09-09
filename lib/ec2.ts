import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';


interface Ec2InsntaceProps {
  vpc: ec2.Vpc;
  name:string;
  availabilityZone: string;
  subnetType: ec2.SubnetType;
  instanceClass: ec2.InstanceClass;
  instanceSize: ec2.InstanceSize;
  ec2SecurityGroup: ec2.SecurityGroup;
  init?:ec2.CloudFormationInit;
};
const gravitonClasses = [
  ec2.InstanceClass.MEMORY6_GRAVITON,
  ec2.InstanceClass.R6G,
  ec2.InstanceClass.MEMORY6_GRAVITON,
  ec2.InstanceClass.R6GD,
  ec2.InstanceClass.MEMORY7_GRAVITON,
  ec2.InstanceClass.R7G,
  ec2.InstanceClass.COMPUTE6_GRAVITON2,
  ec2.InstanceClass.C6G,
  ec2.InstanceClass.COMPUTE7_GRAVITON3,
  ec2.InstanceClass.C7G,
  ec2.InstanceClass.COMPUTE6_GRAVITON2_NVME_DRIVE,
  ec2.InstanceClass.C6GD,
  ec2.InstanceClass.COMPUTE6_GRAVITON2_HIGH_NETWORK_BANDWIDTH,
  ec2.InstanceClass.C6GN,
  ec2.InstanceClass.STORAGE4_GRAVITON_NETWORK_OPTIMIZED,
  ec2.InstanceClass.IM4GN,
  ec2.InstanceClass.STORAGE4_GRAVITON_NETWORK_STORAGE_OPTIMIZED,
  ec2.InstanceClass.IS4GEN,
  ec2.InstanceClass.BURSTABLE4_GRAVITON,
  ec2.InstanceClass.T4G,
  ec2.InstanceClass.MEMORY_INTENSIVE_2_GRAVITON2,
  ec2.InstanceClass.X2G,
  ec2.InstanceClass.MEMORY_INTENSIVE_2_GRAVITON2_NVME_DRIVE,
  ec2.InstanceClass.X2GD,
  ec2.InstanceClass.GRAPHICS5_GRAVITON2,
  ec2.InstanceClass.G5G,
  ec2.InstanceClass.STANDARD6_GRAVITON,
  ec2.InstanceClass.M6G,
  ec2.InstanceClass.STANDARD6_GRAVITON2_NVME_DRIVE,
  ec2.InstanceClass.M6GD,
  ec2.InstanceClass.STANDARD7_GRAVITON,
  ec2.InstanceClass.M7G,
];

export class Ec2Instance extends Construct {
  private instance:ec2.Instance;
  constructor(scope: Construct, id: string, props: Ec2InsntaceProps) {
    super(scope, id);
/*
    const smPolicy = new iam.Policy(this,'SecretsManagerDescribe',{
      statements:[new iam.PolicyStatement({
        effect:iam.Effect.ALLOW,
        actions:[
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue"
        ],
        resources:["*"]
      })]
    });

    const smRole = new iam.Role(this,'SecretsManagerRole',{
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    smRole.attachInlinePolicy(smPolicy);
*/
    let cpuType = ec2.AmazonLinuxCpuType.X86_64;
    if(gravitonClasses.includes(props.instanceClass)){
      cpuType = ec2.AmazonLinuxCpuType.ARM_64;
    }
    const machineImage = ec2.MachineImage.latestAmazonLinux2({
      cpuType: cpuType,
    });
    if( props.availabilityZone == 'any'){
      this.instance = new ec2.Instance(this, props.name, {
        vpc: props.vpc,
        vpcSubnets: { subnetType: props.subnetType},
        ssmSessionPermissions: true,
        instanceType: ec2.InstanceType.of(props.instanceClass, props.instanceSize),
        machineImage: machineImage,
        securityGroup: props.ec2SecurityGroup,
        requireImdsv2: true,
        init:props.init,
/*        role:smRole,*/
      });
    }else{
      this.instance = new ec2.Instance(this, props.name, {
        vpc: props.vpc,
        vpcSubnets: { subnetType: props.subnetType},
        availabilityZone: props.availabilityZone,
        ssmSessionPermissions: true,
        instanceType: ec2.InstanceType.of(props.instanceClass, props.instanceSize),
        machineImage: machineImage,
        securityGroup: props.ec2SecurityGroup,
        requireImdsv2: true,
        init:props.init,
/*        role:smRole,*/
      });
    }
  }
  public getInstance():ec2.Instance{
    return this.instance;
  }
}
