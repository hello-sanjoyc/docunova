#!/bin/bash

#setting if some error comes, stop the script right away
set -e
echo "========================"
echo "DEPLOYMENT PROCESS START"
echo "========================"
echo ""
echo "Pulling latest code from git repo and putting it in the required place"
cd /var/www/docunova.app
git pull origin main
echo ""
echo "Entering to the backend folder and also creating log folder"
cd /var/www/docunova.app/backend
if [ ! -d "logs" ]; then
    mkdir logs
    chmod 777 logs
fi
echo ""
echo "Installing npm dependencies"
npm install
echo ""
echo "========================"
echo ""
echo "Entering to the frontend folder"
cd /var/www/docunova.app/frontend
echo ""
echo "Installing frontend dependencies"
npm install
echo ""
echo "Building frontend"
npm run build
echo ""
echo "========================"
echo ""
echo "Entering to the www folder"
cd /var/www
echo ""
echo "Starting or restarting pm2 instances"
pm2 restart ecosystem.config.js --only DocuNova
echo "Saving pm2 processes"
pm2 save
echo "========================="
echo "DEPLOYMENT PROCESS END"
echo "========================="
pm2 status