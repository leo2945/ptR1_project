// modules/webrtcClient.js

export class WebRTCClient {
  #pc;
  #videoElement;

  constructor(videoElement) {
    this.#videoElement = videoElement;
    this.#pc = new RTCPeerConnection();

    const videoTransceiver = this.#pc.addTransceiver('video', {
      direction: 'recvonly'
    });

    const preferredCodecs = RTCRtpSender.getCapabilities('video').codecs.filter(codec =>
      codec.mimeType === 'video/H264' &&
      codec.sdpFmtpLine?.includes('packetization-mode=1')
    );
    videoTransceiver.setCodecPreferences(preferredCodecs);

    this.#pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log('[WebRTC] 🎥 Setting video srcObject');
        this.#videoElement.srcObject = event.streams[0];
      }
    };

    this.#pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('[ICE] ❄️ New candidate:', e.candidate.candidate);
      } else {
        console.log('[ICE] ❄️ All candidates sent');
      }
    };

    this.#pc.onicegatheringstatechange = () => {
      console.log('[ICE] 📡 Gathering state:', this.#pc.iceGatheringState);
    };

    console.log('[WebRTC] ✅ Codec limited to H264 only');
  }

  async startConnection(endpointUrl) {
    try {
      console.log('[WebRTC] 🚀 Starting connection...');
      const offer = await this.#pc.createOffer();
      await this.#pc.setLocalDescription(offer);

      await this.#waitForIceComplete();

      console.log('[SDP] 📤 Sending offer to MediaMTX:\n', this.#pc.localDescription.sdp);
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: this.#pc.localDescription.sdp
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`MediaMTX responded with status ${res.status}: ${errorText}`);
      }

      const answerSdp = await res.text();
      await this.#pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp
      }));

      console.log('[WebRTC] 🎉 ✅ Connected!');
    } catch (err) {
      console.error('[WebRTC] ❌ Connection failed:', err);
    }
  }

  async #waitForIceComplete() {
    if (this.#pc.iceGatheringState === 'complete') return;
    return new Promise((resolve) => {
      const checkState = () => {
        if (this.#pc.iceGatheringState === 'complete') {
          this.#pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };
      this.#pc.addEventListener('icegatheringstatechange', checkState);
    });
  }
}
