#!/usr/bin/env node
import { cpSync,mkdirSync,writeFileSync,existsSync,renameSync,readFileSync } from 'node:fs';
import { dirname,join,resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const label='com.eaglish.flight-radar';
const root=join(homedir(),'Library','Application Support','Eaglish','flight-radar');
const plist=join(homedir(),'Library','LaunchAgents',label+'.plist');
const command=process.argv[2];
if(!['install','uninstall','status'].includes(command))throw new Error('Use install, uninstall or status');
const domain='gui/'+process.getuid();
if(command==='status'){
  try{process.stdout.write(execFileSync('/bin/launchctl',['print',domain+'/'+label],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));}catch{console.log('not_loaded');}
}else if(command==='uninstall'){
  try{execFileSync('/bin/launchctl',['bootout',domain+'/'+label],{stdio:'ignore'});}catch{}
  if(existsSync(plist))renameSync(plist,plist+'.disabled-'+Date.now());
  console.log(JSON.stringify({status:'unloaded',dataRetained:root}));
}else{
  if(process.platform!=='darwin')throw new Error('This installer uses macOS launchd');
  if(existsSync(plist))throw new Error('Existing collector found; inspect and explicitly unload it before replacement');
  const source=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const release=join(root,'releases',new Date().toISOString().replaceAll(':','-'));
  mkdirSync(release,{recursive:true,mode:0o700});
  cpSync(join(source,'src'),join(release,'src'),{recursive:true,errorOnExist:true});
  cpSync(join(source,'config'),join(release,'config'),{recursive:true,errorOnExist:true});
  const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const hours=[6,13,20];
  const text=`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(join(release,'src','radar-job.mjs'))}</string></array>
  <key>WorkingDirectory</key><string>${xml(release)}</string>
  <key>RunAtLoad</key><true/>
  <key>StartCalendarInterval</key><array>${hours.map(h=>`<dict><key>Hour</key><integer>${h}</integer><key>Minute</key><integer>30</integer></dict>`).join('')}</array>
  <key>ProcessType</key><string>Background</string><key>LowPriorityIO</key><true/>
  <key>StandardOutPath</key><string>${xml(join(root,'collector.log'))}</string>
  <key>StandardErrorPath</key><string>${xml(join(root,'collector-error.log'))}</string>
  </dict></plist>`;
  mkdirSync(dirname(plist),{recursive:true});writeFileSync(plist,text,{mode:0o600});
  execFileSync('/usr/bin/plutil',['-lint',plist],{stdio:'inherit'});
  execFileSync('/bin/launchctl',['bootstrap',domain,plist],{stdio:'inherit'});
  const receipt={installedAt:new Date().toISOString(),label,release,plist,node:process.execPath,schedule:'06:30 / 13:30 / 20:30 host timezone',dailyRequestLimit:JSON.parse(readFileSync(join(release,'config','radar.json'),'utf8')).dailyRequestLimit,authority:'Hiram 2026-09-13: sleep-development-mode; complete the reviewed roadmap including bounded data collection',externalPublication:false};
  writeFileSync(join(root,'installation.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(receipt,null,2));
}
