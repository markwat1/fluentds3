import { Construct } from 'constructs';
import { aws_elasticloadbalancingv2 as elb } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2_targets as elbtgt } from 'aws-cdk-lib';
import { aws_ec2 as ec2} from 'aws-cdk-lib';
//import { aws_s3 as s3} from 'aws-cdk-lib';
import { Ec2Instance} from './ec2';

export interface AlbProps {
    vpc: ec2.Vpc;
    securityGroup: ec2.SecurityGroup;
    instances:Ec2Instance[];
};

export class Alb extends Construct {
  private alb:elb.ApplicationLoadBalancer;
  private listener:elb.ApplicationListener;
  constructor(scope: Construct, id: string, props: AlbProps) {
    super(scope, id);
//    const logBucket = new s3.Bucket(this,id + "LogBucket",{});
    this.alb = new elb.ApplicationLoadBalancer(this,id + 'ALB',{
    vpc:props.vpc,
    internetFacing: true,
      securityGroup:props.securityGroup,
    });
//    this.alb.logAccessLogs(logBucket);
    this.listener = this.alb.addListener(id + 'Listener',{
      port:80,
      open:true,
    });
    let targets:elbtgt.InstanceIdTarget[] = [];
    for(const instance of props.instances){
      targets.push(new elbtgt.InstanceTarget(instance.getInstance(),80));
    }

    this.listener.addTargets(id + 'AlbFleet',{
      port:80,
      targets:targets,
      healthCheck:{
        path: "/",
        healthyHttpCodes:'200'
      },
    });
  }
  public getListener(){
    return this.listener;
  }
  public getAlb(){
    return this.alb;
  }
}

