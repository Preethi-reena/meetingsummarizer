from flask import Flask, request, jsonify
import whisper
import os
import subprocess

app = Flask(__name__)

whisper_model = whisper.load_model("base")

def convert_webm_to_wav(input_file, output_file):
    try:
        command = f"ffmpeg -i {input_file} -acodec pcm_s16le -ac 1 -ar 16000 {output_file}"
        subprocess.run(command, shell=True, check=True)
        return True
    except Exception as e:
        print(f" FFmpeg conversion failed: {e}")
        return False

@app.route("/summarize", methods=["POST"])
def transcribe_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    temp_webm = "temp_audio.webm"
    temp_wav = "temp_audio.wav"
    file.save(temp_webm)

    print(f"🔹 Audio received: {temp_webm}")

    if not convert_webm_to_wav(temp_webm, temp_wav):
        return jsonify({"error": "FFmpeg conversion failed"}), 500

    try:
        result = whisper_model.transcribe(temp_wav)
        transcription = result["text"]
        print(f"✅ Transcription: {transcription}")

        return jsonify({"transcription": transcription})
    except Exception as e:
        print(f"❌ Error during transcription: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
       
        if os.path.exists(temp_webm):
            os.remove(temp_webm)
        if os.path.exists(temp_wav):
            os.remove(temp_wav)

if __name__ == "__main__":
    app.run(debug=True)
