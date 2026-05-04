import mammoth from "mammoth";

async function main() {
  const r = await mammoth.extractRawText({ path: "C:\\Users\\Gabrecht\\Desktop\\Data\\7.docx" });
  console.log("Length:", r.value.length);
  console.log("First 250 chars:");
  console.log(r.value.substring(0, 250));
  console.log("\nLast 200 chars:");
  console.log(r.value.substring(r.value.length - 200));
  console.log("\nPosition first [:", r.value.indexOf("["));
  console.log("Position last ]:", r.value.lastIndexOf("]"));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
