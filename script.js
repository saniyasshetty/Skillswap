const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const ws = new WebSocket('ws://localhost:3000');
const peer = new RTCPeerConnection();
let localStream;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
  })
  .catch(e => alert('Could not get media: ' + e));

peer.ontrack = e => {
  remoteVideo.srcObject = e.streams[0];
};

peer.onicecandidate = e => {
  if (e.candidate) {
    ws.send(JSON.stringify({ candidate: e.candidate }));
  }
};

ws.onmessage = async message => {
  const data = JSON.parse(message.data);
  if (data.offer) {
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer }));
  } else if (data.answer) {
    await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

function startCall() {
  peer.createOffer().then(offer => {
    peer.setLocalDescription(offer);
    ws.send(JSON.stringify({ offer }));
  });
}
