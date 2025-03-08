let mediaRecorder;
let audioChunks = [];

document.getElementById("startRecording").addEventListener("click", async () => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!stream) {
            alert("Microphone access failed.");
            return;
        }

        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            let audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            let audioUrl = URL.createObjectURL(audioBlob);

            let audioElement = document.getElementById("audioPlayback");
            audioElement.src = audioUrl;
            audioElement.controls = true;

            let formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");

            try {
                let response = await fetch("http://127.0.0.1:5000/summarize", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Failed to transcribe, status: ${response.status}`);
                }

                let result = await response.json();
                if (result.transcription) {
                    document.getElementById("transcriptionResult").value = result.transcription;
                    document.getElementById("Summarize").disabled = false;
                } else {
                    alert("Transcription failed: " + (result.error || "Unknown error"));
                }
            } catch (error) {
                console.error("❌ Transcription request failed:", error);
                alert("Error during transcription. Check console for details.");
            }
        };

        audioChunks = [];
        mediaRecorder.start();
        document.getElementById("stopRecording").disabled = false;
        document.getElementById("startRecording").disabled = true;
    } catch (error) {
        console.error("Error starting recording:", error);
        alert("Failed to start recording. Please check your microphone permissions.");
    }
});

document.getElementById("stopRecording").addEventListener("click", () => {
    mediaRecorder.stop();
    document.getElementById("stopRecording").disabled = true;
    document.getElementById("startRecording").disabled = false;
});

document.getElementById("Summarize").addEventListener("click", async () => {
    let text = document.getElementById("transcriptionResult").value;
    if (!text) {
        alert("No transcription available to summarize!");
        return;
    }

    try {
        let response = await fetch("http://127.0.0.1:5000/summarize_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Failed to summarize, status: ${response.status}`);
        }

        let result = await response.json();
        if (result.summary) {
            alert("Summary: " + result.summary);
        } else {
            alert("Summarization failed: " + (result.error || "Unknown error"));
        }
    } catch (error) {
        console.error(" Error during summarization:", error);
        alert("Failed to summarize. Please try again.");
    }
});
