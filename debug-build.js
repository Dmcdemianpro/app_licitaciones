process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:');
  console.error(error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  process.exit(1);
});

require('next/dist/bin/next');
