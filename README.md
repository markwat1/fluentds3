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

# requirements for password generator
```
npm install mersenne-twister
npm install --save @types/mersenne-twister
```
# build cert file
```
openssl req -new -x509 -sha256 -days 10800 -newkey rsa:4096 -keyout cert/fluentd.key -out cert/fluentd.crt
```
# Prepare
create s3 bucket
# setup permission for ec2 to access S3
s3:PutObject
s3:GetObject
s3:GetObjectAttributes
# setup td agent
## install td-agent(fluentd)
```
curl -L https://toolbelt.treasuredata.com/sh/install-amazon2-td-agent3.sh | sh
```
## setup /etc/init.d/td-agent 
```
sed -i 's/TD_AGENT_USER=td-agent/TD_AGENT_USER=root/' /etc/init.d/td-agent
sed -i 's/TD_AGENT_GROUP=td-agent/TD_AGENT_GROUP=root/' /etc/init.d/td-agent
```
## setup  /usr/lib/systemd/system/td-agent.service
```
sed -i 's/User=td-agent/User=root/' /usr/lib/systemd/system/td-agent.service
sed -i 's/Group=td-agent/Group=root/' /usr/lib/systemd/system/td-agent.service
```
## source instance
### setup /etc/td-agent/td-agent.conf
```
<match td.messages.access>
  @type forward
  <server>
    name fluentd-server
    host 10.0.1.149
    port 24224
  </server>
</match>
<source>
  @type tail
  path /var/log/messages
  tag td.messages.access
  pos_file /var/log/td-agent/messages.pos
  format syslog
</source>
```
## forwarder instance
### setup /etc/td-agent/td-agent.conf
```
<source>
  @type tail
  path /var/log/messages
  tag td.messages.access
  pos_file /var/log/td-agent/messages.pos
  format syslog
</source>
<source>
  @type forward
  port 24224
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
```
