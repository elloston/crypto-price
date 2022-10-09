const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  publicPath: '/crypto-price/',
  transpileDependencies: true,
  lintOnSave: false,
  css: {
    loaderOptions: {
      scss: {
        additionalData: `
          @import "@/scss/main.scss";
        `,
      },
    },
  },
});
