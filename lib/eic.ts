import { Construct } from 'constructs';
import { custom_resources as cr } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';


export interface EicProps {
  securityGroupId: string;
  subnetId: string;
};
export class Eic extends Construct {
  constructor(scope: Construct, id: string, props: EicProps) {
    super(scope, id);
    new cr.AwsCustomResource(this, 'eic', {
      installLatestAwsSdk: true,
      onUpdate: {
        service: 'EC2',
        action: 'createInstanceConnectEndpoint',
        parameters: {
          SubnetId: props.subnetId,
          DryRun: false,
          PreserveClientIp: true,
          SecurityGroupIds: [
            props.securityGroupId
          ]
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse("InstanceConnectEndpoint.InstanceConnectEndpointId")
      },
      onDelete: {
        service: 'EC2',
        action: 'deleteInstanceConnectEndpoint',
        parameters: {
          DryRun: false,
          InstanceConnectEndpointId: new cr.PhysicalResourceIdReference()
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: [
            "ec2:CreateInstanceConnectEndpoint",
            "ec2:CreateNetworkInterface",
            "ec2:CreateTags",
            "ec2:DeleteInstanceConnectEndpoint",
            "iam:CreateServiceLinkedRole"
          ],
          resources: ["*"],
        }),
      ]),
    });
  }
}
