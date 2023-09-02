# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

#create s3 bucket
#setup role for s3 bucket putobject
#install td-agent fluentd
curl -L https://toolbelt.treasuredata.com/sh/install-amazon2-td-agent3.sh | sh

# setup /etc/init.d/td-agent 
 td-agent to root
# setup  /usr/lib/systemd/system/td-agent.service
 td-agent to root
# setup /etc/td-agent/td-agent.conf
# source instance
 <match td.messages.access>
  @type forward
  <server>
    name fluentd-server
    host 10.0.3.214
    port 2424
  </server>
</match>
<source>
  @type tail
  path /var/log/messages
  tag td.messages.access
  pos_file /var/log/td-agent/messages.pos
  format syslog
</source>

# forwarder instance
<source>
  @type tail
  path /var/log/messages
  tag td.messages.access
  pos_file /var/log/td-agent/messages.pos
  format syslog
</source>
<source>
  @type forward
  port 2424
  bind 0.0.0.0
  @id input_forward
  tag td.messages.forwarded
</source>
<match td.messages.forwarded>
  @type s3
  s3_bucket td-nabemasa-test
  s3_region ap-northeast-1
  time_slice_format forwarded-%Y%m%d%H%M
</match>

