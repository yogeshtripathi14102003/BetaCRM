// jsdom Blob ko Node ka Response nahi padh paata, isliye FileReader
export const blobText = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(blob);
  });
