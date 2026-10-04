import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',use:{baseURL:'http://localhost:3107',trace:'retain-on-failure'},webServer:{command:'npm run dev -- --port 3107',url:'http://localhost:3107',reuseExistingServer:false},projects:[{name:'desktop',use:{viewport:{width:1280,height:800}}},{name:'mobile',use:{viewport:{width:390,height:844}}}]});
