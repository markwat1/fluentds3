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
echo '<match td.messages.access>' > /etc/td-agent/td-agent.conf
echo '  @type forward' >> /etc/td-agent/td-agent.conf
echo '  transport tls' >> /etc/td-agent/td-agent.conf
echo '  tls_verify_hostname false' >> /etc/td-agent/td-agent.conf
echo '  <server>' >> /etc/td-agent/td-agent.conf
echo '    name fluentd-server' >> /etc/td-agent/td-agent.conf
echo '    host __FORWARDER_IP_ADDRESS__' >> /etc/td-agent/td-agent.conf
echo '    port __FLUENTD_PORT__' >> /etc/td-agent/td-agent.conf
echo '  </server>' >> /etc/td-agent/td-agent.conf
echo '</match>' >> /etc/td-agent/td-agent.conf
echo '<source>' >> /etc/td-agent/td-agent.conf
echo '  @type tail' >> /etc/td-agent/td-agent.conf
echo '  path /var/log/messages' >> /etc/td-agent/td-agent.conf
echo '  tag td.messages.access' >> /etc/td-agent/td-agent.conf
echo '  pos_file /var/log/td-agent/messages.pos' >> /etc/td-agent/td-agent.conf
echo '  format syslog' >> /etc/td-agent/td-agent.conf
echo '</source>' >> /etc/td-agent/td-agent.conf
systemctl enable td-agent
systemctl start td-agent
