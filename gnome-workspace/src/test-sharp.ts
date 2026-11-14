import sharp from "sharp";

export async function test() {
  const buffer = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: "#ff0000",
    },
  })
    .png()
    .toBuffer();

  console.log("Sharp works!", buffer.length);
}

// test();