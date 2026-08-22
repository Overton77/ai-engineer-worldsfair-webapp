import { defineConfig } from "@playwright/test";
export default defineConfig({testDir:"./tests/e2e",fullyParallel:false,retries:0,use:{baseURL:process.env.PLAYWRIGHT_BASE_URL??"http://127.0.0.1:3000",trace:"on",screenshot:"on",video:"on"},outputDir:"test-results/mission-001",webServer:{command:"pnpm dev",url:"http://127.0.0.1:3000",reuseExistingServer:true,timeout:120000}});
