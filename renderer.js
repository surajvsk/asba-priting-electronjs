window.electronAPI.onPDFOverlayDone((result) => {
  console.log('Received from main:', result);
//   alert(result.message); // show feedback to user
});