#!/usr/bin/env python3
"""Genera un video verticale 1080x1920 da un copione JSON.
Uso: python3 genera.py copione.json out.mp4
copione: {"titolo": "...", "episodio": 1, "saldo": 96.8, "speso": 3.2, "incassato": 0,
          "battute": ["frase 1", "frase 2", ...]}
Voce: piper (locale, open source), voce it_IT-paola-medium.
"""
import json, os, subprocess, sys, tempfile, textwrap, wave
from PIL import Image, ImageDraw, ImageFont

QUI = os.path.dirname(os.path.abspath(__file__))
VOCE = os.path.join(QUI, "piper", "it_IT-paola-medium.onnx")
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FONT_S = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_SB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
W, H = 1080, 1920
ORO = (232, 185, 60)
SFONDO = (18, 16, 24)


def tts(testo, out):
    subprocess.run(["/mondo/identita/voce.sh", testo, out], check=True, capture_output=True)
    with wave.open(out) as w:
        return w.getnframes() / w.getframerate()


def fotogramma(c, frase, i, n, out):
    img = Image.new("RGB", (W, H), SFONDO)
    d = ImageDraw.Draw(img)
    # alone dorato dietro la moneta
    for r in range(380, 0, -20):
        a = int(40 * (1 - r / 380))
        d.ellipse([W/2 - r, 520 - r, W/2 + r, 520 + r], fill=(18 + a, 16 + int(a*0.8), 24))
    volto = Image.open("/mondo/identita/ritratto.png").convert("RGBA").resize((520, 520))
    m = Image.new("L", (520, 520), 0); ImageDraw.Draw(m).ellipse([0, 0, 519, 519], fill=255); volto.putalpha(m)
    img.paste(volto, (int(W/2 - 260), 260), volto)
    f_t = ImageFont.truetype(FONT_SB, 44)
    d.text((W/2, 140), f"LIRA · episodio {c.get('episodio', 1)}", font=f_t, fill=ORO, anchor="mm")
    f_sub = ImageFont.truetype(FONT_S, 34)
    d.text((W/2, 195), c.get("titolo", ""), font=f_sub, fill=(200, 200, 210), anchor="mm")
    # frase
    en = (c.get("en") or [None]*n)[i] if c.get("en") else None
    if en:
        f_f = ImageFont.truetype(FONT_B, 54); righe = textwrap.wrap(frase, 30)
        y = 900 + max(0, (4 - len(righe))) * 30
        for r in righe:
            d.text((W/2, y), r, font=f_f, fill=(250, 248, 240), anchor="mm"); y += 70
        f_e = ImageFont.truetype(FONT_S, 38); y += 20
        for r in textwrap.wrap(en, 44):
            d.text((W/2, y), r, font=f_e, fill=(232, 185, 60), anchor="mm"); y += 50
    else:
        f_f = ImageFont.truetype(FONT_B, 66)
        righe = textwrap.wrap(frase, 24)
        y = 1000 + max(0, (5 - len(righe))) * 40
        for r in righe:
            d.text((W/2, y), r, font=f_f, fill=(250, 248, 240), anchor="mm")
            y += 86
    # pannello conto
    d.rounded_rectangle([90, 1560, W - 90, 1800], 30, fill=(32, 29, 42))
    f_n = ImageFont.truetype(FONT_SB, 56)
    f_l = ImageFont.truetype(FONT_S, 30)
    col = [("SALDO", f"{c['saldo']:.2f} €", ORO), ("SPESO", f"{c['speso']:.2f} €", (235, 110, 100)),
           ("INCASSATO", f"{c['incassato']:.2f} €", (120, 210, 140))]
    for k, (lab, val, colr) in enumerate(col):
        x = 90 + (W - 180) * (k + 0.5) / 3
        d.text((x, 1630), lab, font=f_l, fill=(160, 160, 175), anchor="mm")
        d.text((x, 1710), val, font=f_n, fill=colr, anchor="mm")
    # barra avanzamento
    d.rectangle([0, H - 14, int(W * (i + 1) / n), H], fill=ORO)
    d.text((W/2, 1860), "un'IA vera · t.me/lira_ia · lira-ia.github.io", font=f_l, fill=(130, 130, 145), anchor="mm")
    img.save(out)


def main():
    c = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    tmp = tempfile.mkdtemp()
    lista_img, lista_aud = [], []
    n = len(c["battute"])
    for i, frase in enumerate(c["battute"]):
        wav = os.path.join(tmp, f"a{i:02d}.wav")
        dur = tts(frase, wav)
        png = os.path.join(tmp, f"f{i:02d}.png")
        fotogramma(c, frase, i, n, png)
        lista_img.append((png, dur))
        lista_aud.append(wav)
    with open(os.path.join(tmp, "img.txt"), "w") as f:
        for png, dur in lista_img:
            f.write(f"file '{png}'\nduration {dur:.3f}\n")
        f.write(f"file '{lista_img[-1][0]}'\n")
    with open(os.path.join(tmp, "aud.txt"), "w") as f:
        for wav in lista_aud:
            f.write(f"file '{wav}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error",
                    "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "img.txt"),
                    "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "aud.txt"),
                    "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast",
                    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", out], check=True)
    print(out)


if __name__ == "__main__":
    main()
