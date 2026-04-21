import os
from google.colab import drive
import pyngrok

def setup_colab():
    drive.mount('/content/drive')
    public_url = pyngrok.ngrok.connect(8000)
    print(public_url)
    return public_url
