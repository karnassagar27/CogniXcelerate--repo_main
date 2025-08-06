const { Langfuse } = require('langfuse');

const langfuse = new Langfuse({
  publicKey: 'pk-lf-814497a9-b6e5-44e5-904e-3efae338ee57', // your public key
  secretKey: 'sk-lf-66950ed1-781d-4975-b66a-14f71141e833', // your secret key
  host: 'http://10.10.20.156:3000', // your Langfuse VM URL
});

async function run() {
  const trace = await langfuse.trace({
    name: 'manual-test-trace',
    userId: 'karna-local-test',
  });

  const span = await trace.span({ name: 'manual-span' });
  await span.end(); // Close the span

  // You do NOT need to manually flush; the SDK handles it
  console.log("✅ Trace and span sent to Langfuse");
}

run().catch(console.error);
