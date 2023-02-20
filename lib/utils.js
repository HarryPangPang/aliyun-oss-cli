'use strict';

const wait = async (seconds = 0) => {
  if (seconds) return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};

module.exports = {
  wait,
};
