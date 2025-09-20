{
  "testDir": "tests",
  "testMatch": ["**/*.spec.ts"],
  "reporter": "html",
  "use": {
    "baseURL": "http://localhost:5173",
    "trace": "retain-on-failure",
    "screenshot": "only-on-failure"
  },
  "projects": [
    {
      "name": "User A",
      "use": {
        "browserName": "chromium",
        "viewport": { "width": 1280, "height": 720 }
      }
    },
    {
      "name": "User B",
      "use": {
        "browserName": "chromium",
        "viewport": { "width": 1280, "height": 720 }
      }
    }
  ],
  "webServer": {
    "command": "pnpm run dev",
    "port": 5173,
    "timeout": 120000,
    "reuseExistingServer": !process.env.CI
  }
}