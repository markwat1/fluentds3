import { Construct } from 'constructs';
import { aws_rds as rds } from 'aws-cdk-lib';
import { Vpc } from './vpc';
import { aws_ec2 as ec2} from 'aws-cdk-lib';
import { aws_secretsmanager as secretsManager } from 'aws-cdk-lib';

interface RdsClusterProps {
    availabilityZones:string[];
    vpc:Vpc;
    securityGroup:ec2.SecurityGroup;
    snapshotId:string;
};

export class RdsCluster extends Construct {
  private cluster:rds.DatabaseCluster;
  private rdsSecret: secretsManager.Secret;
  constructor(scope: Construct, id: string, props: RdsClusterProps) {
    super(scope, id);
    this.rdsSecret = new secretsManager.Secret(this,"rdsSecret",{
      secretName:'rds-cluster-secret',
      generateSecretString:{
        excludeCharacters: '/@" ',
        passwordLength:20,
        generateStringKey: "password",
        secretStringTemplate:JSON.stringify({username:"admin"}),
      }
    });

    if (props.snapshotId != 'none') {
      this.cluster = new rds.DatabaseClusterFromSnapshot(this, id + 'cluster', {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_03_1,
        }),
        snapshotIdentifier: props.snapshotId,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [props.securityGroup],
        vpc: props.vpc.getVpc(),
        snapshotCredentials: rds.SnapshotCredentials.fromSecret(this.rdsSecret),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
        }),
        readers: [
          rds.ClusterInstance.provisioned('reader1', {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
          }),
        ],
      });
    } else {
      this.cluster = new rds.DatabaseCluster(this, id + 'cluster', {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_03_1,
        }),
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [props.securityGroup],
        vpc: props.vpc.getVpc(),
        credentials: rds.Credentials.fromSecret(this.rdsSecret),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
        }),
        readers: [
          rds.ClusterInstance.provisioned('reader1', {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
          }),
        ],
      });
    }
  }
  public getCluster() {
    return this.cluster;
  }
  public getSecret() {
    return this.rdsSecret;
  }
};
