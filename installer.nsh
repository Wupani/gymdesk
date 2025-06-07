; GymDesk Installer Script
; Bu dosya NSIS installer için özel ayarlar içerir

; Türkçe dil desteği
!include "MUI2.nsh"
!include "FileFunc.nsh"

; Installer sayfaları
!define MUI_WELCOMEPAGE_TITLE "GymDesk Kurulumuna Hoş Geldiniz"
!define MUI_WELCOMEPAGE_TEXT "Bu sihirbaz GymDesk Spor Salonu Yönetim Sistemi'ni bilgisayarınıza kuracaktır.$\r$\n$\r$\nDevam etmeden önce diğer tüm uygulamaları kapatmanız önerilir.$\r$\n$\r$\nKuruluma devam etmek için İleri'ye tıklayın."

!define MUI_LICENSEPAGE_TEXT_TOP "Lütfen lisans sözleşmesini okuyun. Kuruluma devam etmek için sözleşmeyi kabul etmelisiniz."
!define MUI_LICENSEPAGE_TEXT_BOTTOM "Sözleşmenin tüm şartlarını kabul ediyorsanız, Kabul Ediyorum'u seçin. GymDesk'i kurmak için sözleşmeyi kabul etmelisiniz."

!define MUI_COMPONENTSPAGE_TEXT_TOP "Kurmak istediğiniz GymDesk bileşenlerini seçin. İleri'ye tıklayarak devam edin."

!define MUI_DIRECTORYPAGE_TEXT_TOP "Kurulum GymDesk'i aşağıdaki klasöre kuracaktır. Farklı bir klasöre kurmak için Gözat'a tıklayın ve başka bir klasör seçin. İleri'ye tıklayarak devam edin."

!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Kurulum Tamamlandı"
!define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "GymDesk başarıyla kuruldu."

!define MUI_FINISHPAGE_TITLE "GymDesk Kurulumu Tamamlandı"
!define MUI_FINISHPAGE_TEXT "GymDesk başarıyla bilgisayarınıza kuruldu.$\r$\n$\r$\nKurulum sihirbazını kapatmak için Son'a tıklayın."
!define MUI_FINISHPAGE_RUN_TEXT "GymDesk'i şimdi çalıştır"
!define MUI_FINISHPAGE_LINK_TEXT "GymDesk web sitesini ziyaret edin"
!define MUI_FINISHPAGE_LINK "https://gymdesk.com"

; Uninstaller sayfaları
!define MUI_UNCONFIRMPAGE_TEXT_TOP "Bu sihirbaz GymDesk'i bilgisayarınızdan kaldıracaktır."

; Özel makrolar
!macro customInstall
  ; Veritabanı klasörü oluştur
  CreateDirectory "$APPDATA\GymDesk"
  CreateDirectory "$APPDATA\GymDesk\data"
  
  ; Başlat menüsü kısayolu
  CreateDirectory "$SMPROGRAMS\GymDesk"
  CreateShortCut "$SMPROGRAMS\GymDesk\GymDesk.lnk" "$INSTDIR\GymDesk.exe"
  CreateShortCut "$SMPROGRAMS\GymDesk\GymDesk'i Kaldır.lnk" "$INSTDIR\Uninstall GymDesk.exe"
  
  ; Masaüstü kısayolu
  CreateShortCut "$DESKTOP\GymDesk.lnk" "$INSTDIR\GymDesk.exe"
  
  ; Dosya ilişkilendirmeleri
  WriteRegStr HKCR ".gymdesk" "" "GymDesk.Document"
  WriteRegStr HKCR "GymDesk.Document" "" "GymDesk Dosyası"
  WriteRegStr HKCR "GymDesk.Document\DefaultIcon" "" "$INSTDIR\GymDesk.exe,0"
  WriteRegStr HKCR "GymDesk.Document\shell\open\command" "" '"$INSTDIR\GymDesk.exe" "%1"'
!macroend

!macro customUnInstall
  ; Kullanıcı verilerini koru (isteğe bağlı)
  MessageBox MB_YESNO "Kullanıcı verilerini ve veritabanını da silmek istiyor musunuz?" IDNO +3
  RMDir /r "$APPDATA\GymDesk"
  Goto +2
  
  ; Başlat menüsü kısayollarını sil
  RMDir /r "$SMPROGRAMS\GymDesk"
  
  ; Masaüstü kısayolunu sil
  Delete "$DESKTOP\GymDesk.lnk"
  
  ; Dosya ilişkilendirmelerini sil
  DeleteRegKey HKCR ".gymdesk"
  DeleteRegKey HKCR "GymDesk.Document"
!macroend 