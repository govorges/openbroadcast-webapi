const generateVideoThumbnail = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");

    video.autoplay = true;
    video.muted = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      let ctx = canvas.getContext("2d");
      URL.revokeObjectURL(file); // Freeing up browser memory. <3

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      video.pause();
      return resolve(canvas.toDataURL("image/png"));
    };
  });
};

function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
}
const handleFileSelect = async (e) => {
  const thumbnail = await generateVideoThumbnail(e.files[0]);
  document.getElementById("videoDetails_Thumbnail").src = thumbnail;
  document.getElementById("videoDetails").style.display = "flex";
}

function handleFileUpload() {
  let _title = document.getElementById("videoDetails_Title").value;
  let _desc = document.getElementById("videoDetails_Description").value;

  let video_metadata = {
    "title": _title,
    "description": _desc 
  };

  let videoFile = document.getElementById("videoDetails_File").files[0];
  let videoThumbnail = document.getElementById("videoDetails_Thumbnail").src;

  let formData = new FormData();

  formData.append("video", videoFile);
  formData.append("thumbnail", dataURItoBlob((videoThumbnail)));
  formData.append("metadata", JSON.stringify(video_metadata));

  fetch("/videos/upload", { method: "POST", body: formData });

  return 1;
}