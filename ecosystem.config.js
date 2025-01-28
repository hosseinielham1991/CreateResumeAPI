module.exports = {
    apps: [
      {
        name: "resumebuilderpro",
        script: "server.js",
        watch: true
      },
      {
        name: "cleanupService",
        script: "cleanupService.js",
        watch: true
      }
    ]
  };