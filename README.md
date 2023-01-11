**Waktu Sholat - Gnome Shell Extention**

Versi sederhana dari [fahrinh azan-gnome-shell-extension](https://github.com/fahrinh/azan-gnome-shell-extension)

Disesuaikan untuk wilayah Indonesia :
- Subuh saat Matahari berada pada sudut -20° di bawah horizon Timur
- Isya' saat Matahari berada pada sudut -18° di bawah horizon Barat

**Requirement**

gnome-shell versi 40, 41, 42, 43

untuk gnome-shell versi 3.6 pakai yang v1.0.0


**Install :**  
untuk lebih mudah nya dapat melakukan instalasi dari https://extensions.gnome.org/extension/4036/waktu-sholat,  
untuk manual install sbb:  
- Copy folder waktu-sholat@arpodungge.github.com ke ~/.local/share/gnome-shell/extensions
- Tekan alt-F2 lalu tekan r dan enter
- Buka Extensions atau Gnone Tweak lalu aktifkan extension waktu-sholat

**Catatan**  
Dalam versi ini tidak disertakan ui untuk konfigurasi  
untuk melakukan konfigurasi silahkan edit file extension.js

```javascript
// konfigurasi  
// default latlon Jakarta : -6.1333, 106.75  
this._myLocation = [-6.1333, 106.75, 10];  
this._myTimezone = +7;  
this._timeFormat= '24h';  
this._prayerMethod='Indonesia';

// Penyesuaian waktu sholat  
this._subuhTune=2;  
this._zuhurTune=2;  
this._asarTune=2;  
this._magribTune=2;  
this._isyaTune=2;
```
