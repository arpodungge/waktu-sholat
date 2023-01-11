const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const PrayTimes = Me.imports.PrayTimes;
const HijriCalendarKuwaiti = Me.imports.HijriCalendarKuwaiti;

const Sholat = GObject.registerClass(
class Sholat extends PanelMenu.Button {

    _init () {
        super._init(0.5, "Sholat");
        this.indicatorText = new St.Label({
            text: _("Sholat"),
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.indicatorText);

        // Konfigurasi
        // Default latlon Jakarta : -6.1333, 106.75
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

        this._dayNames = new Array("Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu");
        this._monthNames = new Array("Muharram", "Shafar", "Rabi'ul Awwal", "Rabi'ul Akhir",
            "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
            "Ramadhan", "Syawal", "Zulqaidah", "Zulhijjah");

        this._timeNames = {
            imsak: 'Imsak',
            fajr: 'Subuh',
            sunrise: 'Terbit',
            dhuhr: 'Zuhur',
            asr: 'Asar',
            maghrib: 'Magrib',
            isha: 'Isya',
            midnight: 'Tengah Malam'
        };

        this._prayItems = {};

        this._buildMenu();
        this._refresh();
    }    

    _buildMenu () {

        let dateMenuItem = new PopupMenu.PopupMenuItem(_(""), {
            reactive: true, hover: false, activate: false
        });
        let bin = new St.Bin({
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._hijriLabel = new St.Label({text: 'Hijri Date'});
        bin.add_actor(this._hijriLabel);
        dateMenuItem.actor.add_actor(bin);
    
        this.menu.addMenuItem(dateMenuItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        for (let prayerId in this._timeNames) {
            let prayerName = this._timeNames[prayerId];
            let prayMenuItem = new PopupMenu.PopupMenuItem(_(prayerName), {
                reactive: true, hover: false, activate: false
            });
    
            let bin = new St.Bin({
                x_expand: true,
                x_align: Clutter.ActorAlign.END,
            });
    
            let prayLabel = new St.Label();
            bin.add_actor(prayLabel);

            prayMenuItem.actor.add_actor(bin);
            this.menu.addMenuItem(prayMenuItem);

            this._prayItems[prayerId] = {
                menuItem: prayMenuItem,
                label: prayLabel
            };
        }
    }

    _refresh () {
        this._reloadPrayerTimes();
        this._removeTimeout();
        this._timeout = Mainloop.timeout_add_seconds(60, Lang.bind(this, this._refresh));
        return true;
    }

    _reloadPrayerTimes () {
        let currentDate = new Date();
        let currentSeconds = this._calculateSecondsFromDate(currentDate);

        let pt = PrayTimes.prayTimes;
        pt.setMethod(this._prayerMethod);
        pt.tune( {fajr: this._subuhTune, dhuhr: this._zuhurTune, asr: this._asarTune, maghrib: this._magribTune, isha: this._isyaTune} );

        let timesStr = pt.getTimes(currentDate, this._myLocation, this._myTimezone, 'auto', this._timeFormat);
        let timesFloat = pt.getTimes(currentDate, this._myLocation, this._myTimezone, 'auto', 'Float');

        let nearestPrayerId;
        let minDiffMinutes = Number.MAX_VALUE;
        let isTimeForPraying = false;
        for (let prayerId in this._timeNames) {
            let prayerName = this._timeNames[prayerId];
            let prayerTime = timesStr[prayerId];

            this._prayItems[prayerId].label.text = prayerTime;

            if (this._isPrayerTime(prayerId)) {

                let prayerSeconds = this._calculateSecondsFromHour(timesFloat[prayerId]);

                let ishaSeconds = this._calculateSecondsFromHour(timesFloat['isha']);
                let fajrSeconds = this._calculateSecondsFromHour(timesFloat['fajr']);

                if (prayerId === 'fajr' && currentSeconds > ishaSeconds) {
                    prayerSeconds = fajrSeconds + (24 * 60 *60);
                }

                let diffSeconds = prayerSeconds - currentSeconds;

                if (diffSeconds > 0) {
                    let diffMinutes = ~~(diffSeconds / 60);

                    if (diffMinutes == 0) {
                        isTimeForPraying = true;
                        nearestPrayerId = prayerId;
                        break;
                    } else if (diffMinutes <= minDiffMinutes) {
                        minDiffMinutes = diffMinutes;
                        nearestPrayerId = prayerId;
                    }
                }

            }
        };

        let hijriDate = HijriCalendarKuwaiti.KuwaitiCalendar();
        let outputIslamicDate = this._formatHijriDate(hijriDate);
        this._hijriLabel.text = outputIslamicDate;

        if (isTimeForPraying) {
            Main.notify(_("Sudah masuk waktu sholat " + this._timeNames[nearestPrayerId]));
            this.indicatorText.set_text(_("Sholat : " + this._timeNames[nearestPrayerId]));
  
        } else {
            this.indicatorText.set_text(this._timeNames[nearestPrayerId] + '  -' + this._formatRemainingTimeFromMinutes(minDiffMinutes));
        };

    }

    _calculateSecondsFromDate (date) {
        return this._calculateSecondsFromHour(date.getHours()) + (date.getMinutes() * 60) + date.getSeconds();
    }
  
    _calculateSecondsFromHour (hour) {
        return (hour * 60 * 60);
    }
  
    _isPrayerTime (prayerId) {
        return prayerId === 'fajr' || prayerId === 'dhuhr' || prayerId === 'asr' || prayerId === 'maghrib' || prayerId === 'isha';
    }
  
    _formatRemainingTimeFromMinutes (diffMinutes) {
        // let diffMinutes = diffSeconds / (60);
  
        let hours = ~~(diffMinutes / 60);
        let minutes = ~~(diffMinutes % 60);
  
        let hoursStr = (hours < 10 ? "0" : "") + hours;
        let minutesStr = (minutes < 10 ? "0" : "") + minutes;
  
        return hoursStr + ":" + minutesStr;
    }

    _formatHijriDate (hijriDate) {
        return this._dayNames[hijriDate[4]] + ", " + hijriDate[5] + " " + this._monthNames[hijriDate[6]] + " " + hijriDate[7] + " H";
    }

    _removeTimeout () {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
    }
    
    stop () {
        if (this._timeout)
            Mainloop.source_remove(this._timeout);
        this._timeout = undefined;

        this.menu.removeAll();
    }
        
})


let menuSholat;

function init() {
    
}

function enable() {
    menuSholat = new Sholat;
	Main.panel.addToStatusArea('sholat-indicator', menuSholat);
}

function disable() {
    menuSholat.stop();
    menuSholat.destroy();
}
