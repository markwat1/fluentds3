import { Construct } from 'constructs';
import {aws_ec2 as ec2} from 'aws-cdk-lib';


interface VpcProps  {
    availabilityZones: string[];
};

export class Vpc extends Construct {
  private vpc:ec2.Vpc;
  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id);
    this.vpc = new ec2.Vpc(this,id + 'vpc',{
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones:props.availabilityZones,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'private-isolate',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
    });
  }
  public getVpc(){
    return this.vpc;
  }
}
