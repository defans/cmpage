module.exports = [{
    interval: '2s',
    immediate: true,
    handle: () => {
      const crontabExe = think.Service('demo/crontab_exe');
      await crontabExe.run();
    }
  }]