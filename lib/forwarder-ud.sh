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
echo '<match td.messages.forwarded>' > /etc/td-agent/td-agent.conf
echo '  @type s3' >> /etc/td-agent/td-agent.conf
echo '  s3_bucket __LOG_BUCKET_NAME__' >> /etc/td-agent/td-agent.conf
echo '  s3_region ap-northeast-1' >> /etc/td-agent/td-agent.conf
echo '  time_slice_format %Y%m%d%H%M' >> /etc/td-agent/td-agent.conf
echo '  <buffer>' >> /etc/td-agent/td-agent.conf
echo '    @type "file"' >> /etc/td-agent/td-agent.conf
echo '    path "/var/log/td-agent/buffer/s3/"' >> /etc/td-agent/td-agent.conf
echo '    timekey 3600' >> /etc/td-agent/td-agent.conf
echo '    timekey_wait 10m' >> /etc/td-agent/td-agent.conf
echo '    chunk_limit_size 2m' >> /etc/td-agent/td-agent.conf
echo '  </buffer>' >> /etc/td-agent/td-agent.conf
echo '</match>' >> /etc/td-agent/td-agent.conf
echo '<source>' >> /etc/td-agent/td-agent.conf
echo '  @type forward' >> /etc/td-agent/td-agent.conf
echo '  port __FLUENTD_PORT__' >> /etc/td-agent/td-agent.conf
echo '  bind 0.0.0.0' >> /etc/td-agent/td-agent.conf
echo '  @id input_forward' >> /etc/td-agent/td-agent.conf
echo '  tag td.messages.forwarded' >> /etc/td-agent/td-agent.conf
echo '</source>' >> /etc/td-agent/td-agent.conf
systemctl enable td-agent
systemctl start td-agent