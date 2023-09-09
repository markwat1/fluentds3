#! /bin/bash
if $(uname -p)x eq X86_64 ; then
yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
else
yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_arm64/amazon-ssm-agent.rpm
fi
systemctl restart amazon-ssm-agent
curl -L https://toolbelt.treasuredata.com/sh/install-amazon2-td-agent3.sh | sh
sed -i 's/TD_AGENT_USER=td-agent/TD_AGENT_USER=root/' /etc/init.d/td-agent
sed -i 's/TD_AGENT_GROUP=td-agent/TD_AGENT_GROUP=root/' /etc/init.d/td-agent
sed -i 's/User=td-agent/User=root/' /usr/lib/systemd/system/td-agent.service
sed -i 's/Group=td-agent/Group=root/' /usr/lib/systemd/system/td-agent.service
systemctl enable td-agent
systemctl start td-agent