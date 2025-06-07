const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let splashWindow;
let db;

// Veritabanı bağlantısını oluştur
function createDatabase() {
  const os = require('os');
  const fs = require('fs');
  
  // Kullanıcının home dizininde data klasörü oluştur
  const dataDir = path.join(os.homedir(), 'GymDesk', 'data');
  const dbPath = path.join(dataDir, 'gymdesk.sqlite');
  
  // data klasörünü oluştur
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Veritabanı bağlantı hatası:', err);
    } else {
      console.log('SQLite veritabanına bağlandı');
      initializeTables();
    }
  });
}

// Tabloları oluştur
function initializeTables() {
  db.serialize(() => {
    // Üyeler tablosu
    db.run(`CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      birth_date TEXT,
      membership_type TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ödemeler tablosu
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id)
    )`);

    // Antrenman planları tablosu (güncellenmiş)
    db.run(`CREATE TABLE IF NOT EXISTS workout_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'Genel',
      duration INTEGER DEFAULT 60,
      difficulty TEXT DEFAULT 'Orta',
      status TEXT DEFAULT 'Planlandi',
      template_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id),
      FOREIGN KEY(template_id) REFERENCES workout_templates(id)
    )`);

    // Antrenman şablonları tablosu
    db.run(`CREATE TABLE IF NOT EXISTS workout_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Orta',
      duration INTEGER DEFAULT 60,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Egzersizler tablosu
    db.run(`CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      equipment TEXT,
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Plan egzersizleri tablosu (many-to-many)
    db.run(`CREATE TABLE IF NOT EXISTS workout_plan_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_plan_id INTEGER,
      exercise_id INTEGER,
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      weight REAL DEFAULT 0,
      rest_seconds INTEGER DEFAULT 60,
      notes TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(workout_plan_id) REFERENCES workout_plans(id),
      FOREIGN KEY(exercise_id) REFERENCES exercises(id)
    )`);

    // Şablon egzersizleri tablosu
    db.run(`CREATE TABLE IF NOT EXISTS template_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER,
      exercise_id INTEGER,
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      weight REAL DEFAULT 0,
      rest_seconds INTEGER DEFAULT 60,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(template_id) REFERENCES workout_templates(id),
      FOREIGN KEY(exercise_id) REFERENCES exercises(id)
    )`);

    // Antrenman geçmişi tablosu
    db.run(`CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_plan_id INTEGER,
      member_id INTEGER,
      completed_at DATETIME,
      duration INTEGER,
      notes TEXT,
      rating INTEGER DEFAULT 5,
      FOREIGN KEY(workout_plan_id) REFERENCES workout_plans(id),
      FOREIGN KEY(member_id) REFERENCES members(id)
    )`);

    // Üye hedefleri tablosu
    db.run(`CREATE TABLE IF NOT EXISTS member_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,
      target_date TEXT,
      goal_type TEXT DEFAULT 'Genel',
      status TEXT DEFAULT 'Aktif',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id)
    )`);

    // Vücut ölçüleri tablosu
    db.run(`CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      height REAL, -- cm
      weight REAL, -- kg
      body_fat_percentage REAL, -- %
      muscle_mass REAL, -- kg
      chest REAL, -- cm
      waist REAL, -- cm
      hips REAL, -- cm
      bicep REAL, -- cm
      thigh REAL, -- cm
      notes TEXT,
      measurement_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id)
    )`);

    // Mevcut workout_plans tablosuna template_id kolunu ekle (yoksa)
    db.run(`ALTER TABLE workout_plans ADD COLUMN template_id INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Template_id kolonu zaten mevcut veya başka bir hata:', err.message);
      } else if (!err) {
        console.log('Template_id kolonu eklendi');
      }
    });

    // Template_exercises tablosuna notes kolunu ekle (yoksa)
    db.run(`ALTER TABLE template_exercises ADD COLUMN notes TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Template_exercises notes kolonu zaten mevcut veya başka bir hata:', err.message);
      } else if (!err) {
        console.log('Template_exercises notes kolonu eklendi');
      }
    });

    console.log('Veritabanı tabloları hazırlandı');
    
    // Kapsamlı örnek veriler ekle (sadece boş veritabanında)
    db.get('SELECT COUNT(*) as count FROM members', (err, row) => {
      if (!err && row.count === 0) {
        
        // Önce örnek üyeleri ekle
        const sampleMembers = [
          ['Ahmet', 'Yılmaz', '05321234567', 'ahmet@email.com', '1990-05-15', 'Aylık', '2024-01-01', '2024-02-01'],
          ['Elif', 'Demir', '05329876543', 'elif@email.com', '1995-08-22', '3-Aylık', '2024-01-15', '2024-04-15'],
          ['Mehmet', 'Kaya', '05334567890', 'mehmet@email.com', '1988-12-10', '6-Aylık', '2023-12-01', '2024-06-01'],
          ['Zeynep', 'Özkan', '05337654321', 'zeynep@email.com', '1992-03-18', 'Yıllık', '2023-11-01', '2024-11-01'],
          ['Can', 'Şahin', '05331122334', 'can@email.com', '1985-07-25', 'Aylık', '2024-01-20', '2024-02-20'],
          ['Selin', 'Aydın', '05335566778', 'selin@email.com', '1998-11-08', '3-Aylık', '2024-01-10', '2024-04-10'],
          ['Emre', 'Çelik', '05338899001', 'emre@email.com', '1991-09-14', 'Aylık', '2024-02-01', '2024-03-01'],
          ['Ayşe', 'Türk', '05332233445', 'ayse@email.com', '1987-04-30', '6-Aylık', '2023-10-15', '2024-04-15'],
          ['Burak', 'Arslan', '05336677889', 'burak@email.com', '1993-06-12', 'Yıllık', '2023-08-01', '2024-08-01'],
          ['Deniz', 'Kılıç', '05334455667', 'deniz@email.com', '1996-01-28', 'Aylık', '2024-01-25', '2024-02-25']
        ];
        
        sampleMembers.forEach(([name, surname, phone, email, birth_date, membership_type, start_date, end_date]) => {
          db.run(
            'INSERT INTO members (name, surname, phone, email, birth_date, membership_type, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, surname, phone, email, birth_date, membership_type, start_date, end_date]
          );
        });
        
        // Örnek ödemeler ekle
        const samplePayments = [
          [1, 150.00, '2024-01-01', 'Nakit'],
          [1, 150.00, '2024-02-01', 'Kredi Kartı'],
          [2, 400.00, '2024-01-15', 'Banka Transferi'],
          [3, 750.00, '2023-12-01', 'Kredi Kartı'],
          [4, 1200.00, '2023-11-01', 'Banka Transferi'],
          [5, 150.00, '2024-01-20', 'Nakit'],
          [5, 150.00, '2024-02-20', 'Kredi Kartı'],
          [6, 400.00, '2024-01-10', 'Kredi Kartı'],
          [7, 150.00, '2024-02-01', 'Nakit'],
          [8, 750.00, '2023-10-15', 'Banka Transferi'],
          [9, 1200.00, '2023-08-01', 'Kredi Kartı'],
          [10, 150.00, '2024-01-25', 'Kredi Kartı'],
          [1, 150.00, '2024-03-01', 'Nakit'],
          [2, 130.00, '2024-04-15', 'Kredi Kartı'],
          [5, 150.00, '2024-03-20', 'Nakit']
        ];
        
        samplePayments.forEach(([member_id, amount, payment_date, payment_method]) => {
          db.run(
            'INSERT INTO payments (member_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)',
            [member_id, amount, payment_date, payment_method]
          );
        });
        
        console.log('Örnek üyeler ve ödemeler eklendi');
      }
    });
    
    // Egzersizleri kontrol et ve ekle
    db.get('SELECT COUNT(*) as count FROM exercises', (err, row) => {
      if (!err && row.count === 0) {
        const sampleExercises = [
          // Göğüs egzersizleri
          ['Bench Press', 'Göğüs', 'Barbell', 'Sırt üstü yatarak, barbell ile göğüs seviyesine indirip kaldırın'],
          ['Incline Dumbbell Press', 'Göğüs', 'Dumbbell', 'Eğimli bench üzerinde dumbbell ile göğüsün üst kısmını çalıştırın'],
          ['Chest Fly', 'Göğüs', 'Dumbbell', 'Kollar hafif büküktü dumbbellı yan yana getirin'],
          ['Push-ups', 'Göğüs', 'Vücut Ağırlığı', 'Klasik şınav hareketi'],
          
          // Sırt egzersizleri
          ['Pull-ups', 'Sırt', 'Vücut Ağırlığı', 'Barfix çekerek sırt kaslarını çalıştırın'],
          ['Lat Pulldown', 'Sırt', 'Makine', 'Lat pulldown makinesinde sırt kaslarını çalıştırın'],
          ['Barbell Row', 'Sırt', 'Barbell', 'Eğilerek barbell çekin'],
          ['Deadlift', 'Sırt', 'Barbell', 'Yerden barbell kaldırın, sırt düz tutun'],
          
          // Omuz egzersizleri
          ['Shoulder Press', 'Omuz', 'Dumbbell', 'Omuz seviyesinden yukarı doğru dumbbell kaldırın'],
          ['Lateral Raises', 'Omuz', 'Dumbbell', 'Kolları yana açarak dumbbell kaldırın'],
          ['Front Raises', 'Omuz', 'Dumbbell', 'Kolları öne doğru dumbbell kaldırın'],
          
          // Kol egzersizleri
          ['Bicep Curls', 'Kol', 'Dumbbell', 'Dirsekleri sabit tutarak dumbbell kaldırın'],
          ['Tricep Dips', 'Kol', 'Vücut Ağırlığı', 'Bench üzerinde tricep kasını çalıştırın'],
          ['Hammer Curls', 'Kol', 'Dumbbell', 'Çekiç tutuşu ile bicep çalıştırın'],
          
          // Bacak egzersizleri
          ['Squats', 'Bacak', 'Barbell', 'Çömelme hareketi ile bacak kaslarını çalıştırın'],
          ['Leg Press', 'Bacak', 'Makine', 'Leg press makinesinde bacak kaslarını çalıştırın'],
          ['Lunges', 'Bacak', 'Dumbbell', 'Öne adım atarak bacak kaslarını çalıştırın'],
          ['Calf Raises', 'Bacak', 'Dumbbell', 'Ayak parmaklarının ucuna kalkın'],
          
          // Karın egzersizleri
          ['Crunches', 'Karın', 'Vücut Ağırlığı', 'Karın kaslarını kasarak üst vücudu kaldırın'],
          ['Plank', 'Karın', 'Vücut Ağırlığı', 'Düz pozisyonda karın kaslarını kasın'],
          ['Russian Twists', 'Karın', 'Vücut Ağırlığı', 'Oturarak sağa sola dönün'],
          
          // Kardiyo egzersizleri
          ['Treadmill', 'Genel', 'Makine', 'Koşu bandında kardiyo yapın'],
          ['Burpees', 'Genel', 'Vücut Ağırlığı', 'Tam vücut kardiyo hareketi'],
          ['Mountain Climbers', 'Genel', 'Vücut Ağırlığı', 'Plank pozisyonunda dizleri göğse getirin']
        ];
        
        sampleExercises.forEach(([name, muscle_group, equipment, instructions]) => {
          db.run(
            'INSERT INTO exercises (name, muscle_group, equipment, instructions) VALUES (?, ?, ?, ?)',
            [name, muscle_group, equipment, instructions]
          );
        });
        
        // Örnek şablonlar ekle
        const sampleTemplates = [
          ['Göğüs ve Tricep', 'Göğüs ve kol arkası kaslarına odaklanan antrenman', 'Güç', 'Orta', 75],
          ['Sırt ve Bicep', 'Sırt ve kol ön kaslarına odaklanan antrenman', 'Güç', 'Orta', 75],
          ['Bacak Günü', 'Alt vücut kaslarına odaklanan yoğun antrenman', 'Güç', 'Zor', 90],
          ['Kardiyo HIIT', 'Yüksek yoğunluklu interval antrenman', 'Kardiyo', 'Kolay', 30],
          ['Full Body', 'Tüm vücut kaslarını çalıştıran antrenman', 'Fonksiyonel', 'Orta', 60]
        ];
        
        sampleTemplates.forEach(([name, description, category, difficulty, duration], templateIndex) => {
          db.run(
            'INSERT INTO workout_templates (name, description, category, difficulty, duration) VALUES (?, ?, ?, ?, ?)',
            [name, description, category, difficulty, duration],
            function(err) {
              if (!err) {
                const templateId = this.lastID;
                
                // Her şablona örnek egzersizler ekle
                if (templateIndex === 0) { // Göğüs ve Tricep
                  const chestExercises = [
                    { exerciseIndex: 1, sets: 4, reps: 8, weight: 60, rest: 90, order: 1 }, // Bench Press
                    { exerciseIndex: 3, sets: 3, reps: 12, weight: 25, rest: 60, order: 2 }, // Chest Fly
                    { exerciseIndex: 13, sets: 3, reps: 10, weight: 20, rest: 60, order: 3 }, // Tricep Dips
                  ];
                  chestExercises.forEach(ex => {
                    db.run(
                      'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, weight, rest_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [templateId, ex.exerciseIndex, ex.sets, ex.reps, ex.weight, ex.rest, ex.order]
                    );
                  });
                } else if (templateIndex === 1) { // Sırt ve Bicep
                  const backExercises = [
                    { exerciseIndex: 5, sets: 4, reps: 6, weight: 0, rest: 120, order: 1 }, // Pull-ups
                    { exerciseIndex: 7, sets: 4, reps: 8, weight: 70, rest: 90, order: 2 }, // Barbell Row
                    { exerciseIndex: 12, sets: 3, reps: 12, weight: 15, rest: 60, order: 3 }, // Bicep Curls
                  ];
                  backExercises.forEach(ex => {
                    db.run(
                      'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, weight, rest_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [templateId, ex.exerciseIndex, ex.sets, ex.reps, ex.weight, ex.rest, ex.order]
                    );
                  });
                } else if (templateIndex === 2) { // Bacak Günü
                  const legExercises = [
                    { exerciseIndex: 15, sets: 5, reps: 5, weight: 100, rest: 180, order: 1 }, // Squats
                    { exerciseIndex: 17, sets: 4, reps: 10, weight: 25, rest: 90, order: 2 }, // Lunges
                    { exerciseIndex: 18, sets: 4, reps: 15, weight: 40, rest: 60, order: 3 }, // Calf Raises
                  ];
                  legExercises.forEach(ex => {
                    db.run(
                      'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, weight, rest_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [templateId, ex.exerciseIndex, ex.sets, ex.reps, ex.weight, ex.rest, ex.order]
                    );
                  });
                } else if (templateIndex === 3) { // Kardiyo HIIT
                  const cardioExercises = [
                    { exerciseIndex: 23, sets: 4, reps: 10, weight: 0, rest: 30, order: 1 }, // Burpees
                    { exerciseIndex: 24, sets: 4, reps: 30, weight: 0, rest: 30, order: 2 }, // Mountain Climbers
                    { exerciseIndex: 4, sets: 3, reps: 20, weight: 0, rest: 60, order: 3 }, // Push-ups
                  ];
                  cardioExercises.forEach(ex => {
                    db.run(
                      'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, weight, rest_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [templateId, ex.exerciseIndex, ex.sets, ex.reps, ex.weight, ex.rest, ex.order]
                    );
                  });
                } else if (templateIndex === 4) { // Full Body
                  const fullBodyExercises = [
                    { exerciseIndex: 1, sets: 3, reps: 10, weight: 50, rest: 90, order: 1 }, // Bench Press
                    { exerciseIndex: 15, sets: 3, reps: 12, weight: 80, rest: 90, order: 2 }, // Squats
                    { exerciseIndex: 7, sets: 3, reps: 10, weight: 60, rest: 90, order: 3 }, // Barbell Row
                    { exerciseIndex: 20, sets: 3, reps: 45, weight: 0, rest: 60, order: 4 }, // Plank
                  ];
                  fullBodyExercises.forEach(ex => {
                    db.run(
                      'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, weight, rest_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [templateId, ex.exerciseIndex, ex.sets, ex.reps, ex.weight, ex.rest, ex.order]
                    );
                  });
                }
              }
            }
          );
        });
        
        // Şablonlar oluşturulduktan sonra örnek antrenman planları ekle
        setTimeout(() => {
          const sampleWorkoutPlans = [
            [1, 'Göğüs Antrenmanı', 'Ahmet için göğüs ve tricep odaklı antrenman', '2024-01-05', 'Güç', 75, 'Orta', 'Tamamlandi', 1],
            [2, 'Sırt Çalışması', 'Elif için sırt kaslarını güçlendirme', '2024-01-18', 'Güç', 80, 'Orta', 'Tamamlandi', 2],
            [3, 'Bacak Günü', 'Mehmet için yoğun bacak antrenmanı', '2024-01-12', 'Güç', 90, 'Zor', 'Tamamlandi', 3],
            [4, 'HIIT Kardiyo', 'Zeynep için kardiyo antrenmanı', '2024-01-20', 'Kardiyo', 30, 'Kolay', 'Tamamlandi', 4],
            [5, 'Full Body', 'Can için tam vücut antrenmanı', '2024-01-25', 'Fonksiyonel', 60, 'Orta', 'Tamamlandi', 5],
            [1, 'Upper Body', 'Ahmet için üst vücut antrenmanı', '2024-02-05', 'Güç', 70, 'Orta', 'Planlandi', 1],
            [2, 'Kardiyo Seansı', 'Elif için kardiyo odaklı antrenman', '2024-02-08', 'Kardiyo', 45, 'Kolay', 'Devam Ediyor', 4],
            [3, 'Güç Antrenmanı', 'Mehmet için güç geliştirme', '2024-02-10', 'Güç', 85, 'Zor', 'Planlandi', 2],
            [6, 'Başlangıç Antrenmanı', 'Selin için giriş seviyesi', '2024-01-15', 'Genel', 45, 'Kolay', 'Tamamlandi', 5],
            [7, 'Kilo Verme', 'Emre için kardiyo yoğun program', '2024-02-05', 'Kardiyo', 50, 'Orta', 'Devam Ediyor', 4],
            [8, 'Kas Geliştirme', 'Ayşe için kas kütlesi artırma', '2024-01-20', 'Güç', 75, 'Orta', 'Tamamlandi', 1],
            [9, 'Atletik Performans', 'Burak için performans artırma', '2024-01-28', 'Fonksiyonel', 90, 'Zor', 'Tamamlandi', 5],
            [10, 'Esneklik Çalışması', 'Deniz için esneklik ve mobilite', '2024-02-01', 'Esneklik', 40, 'Kolay', 'Planlandi', null]
          ];
          
          sampleWorkoutPlans.forEach(([member_id, title, description, date, category, duration, difficulty, status, template_id]) => {
            db.run(
              'INSERT INTO workout_plans (member_id, title, description, date, category, duration, difficulty, status, template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [member_id, title, description, date, category, duration, difficulty, status, template_id]
            );
          });
          
          // Workout sessions (tamamlanan antrenmanlar) ekle
          const sampleSessions = [
            [1, 1, '2024-01-05 10:00:00', 78, 'İyi bir antrenman oldu', 5],
            [2, 2, '2024-01-18 14:30:00', 82, 'Sırt kasları iyi çalıştı', 4],
            [3, 3, '2024-01-12 09:15:00', 95, 'Zorlu ama verimli bacak antrenmanı', 5],
            [4, 4, '2024-01-20 16:00:00', 32, 'Yoğun kardiyo seansı', 4],
            [5, 5, '2024-01-25 11:00:00', 62, 'Tüm vücut güzel çalıştı', 5],
            [9, 9, '2024-01-15 08:00:00', 48, 'Başlangıç için uygundu', 4],
            [11, 8, '2024-01-20 13:00:00', 76, 'Kas grupları iyi hedeflendi', 5],
            [12, 9, '2024-01-28 17:00:00', 92, 'Atletik performans gelişti', 5],
            [1, 6, '2024-02-05 10:30:00', 72, 'Upper body iyi çalıştı', 4],
            [10, 7, '2024-02-05 15:00:00', 52, 'Kardiyo tempo iyiydi', 4]
          ];
          
          sampleSessions.forEach(([workout_plan_id, member_id, completed_at, duration, notes, rating]) => {
            db.run(
              'INSERT INTO workout_sessions (workout_plan_id, member_id, completed_at, duration, notes, rating) VALUES (?, ?, ?, ?, ?, ?)',
              [workout_plan_id, member_id, completed_at, duration, notes, rating]
            );
          });
          
          // Üye hedefleri ekle
          const sampleGoals = [
            [1, 'Aylık 12 Antrenman', 'Bu ay toplam 12 antrenman yapmak', 12, 8, '2024-02-29', 'Antrenman Sayısı', 'Aktif'],
            [2, '5 Kilo Kilo Kaybı', 'Mart sonuna kadar 5 kilo vermek', 5, 2.5, '2024-03-31', 'Kilo Kaybı', 'Aktif'],
            [3, 'Squat PR', 'Squat kaldırma rekorunu 120kg yapmak', 120, 100, '2024-04-30', 'Güç Artışı', 'Aktif'],
            [4, 'Kardiyo Dakikası', 'Haftalık 150 dakika kardiyo', 150, 120, '2024-02-25', 'Kardiyo Süresi', 'Aktif'],
            [5, 'Kas Kütlesi', '3 kilo kas kütlesi artırmak', 3, 1.2, '2024-05-31', 'Kas Kütlesi', 'Aktif'],
            [6, 'Düzenli Antrenman', 'Haftada 3 gün düzenli antrenman', 12, 6, '2024-02-29', 'Antrenman Sayısı', 'Aktif'],
            [7, 'Yağ Yakımı', '8% vücut yağ oranına düşmek', 8, 12, '2024-06-30', 'Kilo Kaybı', 'Aktif'],
            [8, 'Esneklik', 'Yoga ile esneklik artırmak', 30, 15, '2024-03-31', 'Esneklik', 'Aktif'],
            [9, 'Atletik Performans', 'Sprint süresini iyileştirmek', 100, 85, '2024-04-15', 'Genel Fitness', 'Aktif'],
            [10, 'Günlük Step', 'Günde 10.000 adım hedefi', 10000, 7500, '2024-02-29', 'Kardiyo Süresi', 'Aktif'],
            [1, 'Bench Press PR', '80kg bench press yapmak', 80, 75, '2024-03-31', 'Güç Artışı', 'Aktif'],
            [3, '2024 Fitness', 'Yıl boyunca formda kalmak', 100, 25, '2024-12-31', 'Genel Fitness', 'Aktif']
          ];
          
          sampleGoals.forEach(([member_id, title, description, target_value, current_value, target_date, goal_type, status]) => {
            db.run(
              'INSERT INTO member_goals (member_id, title, description, target_value, current_value, target_date, goal_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [member_id, title, description, target_value, current_value, target_date, goal_type, status]
            );
          });
          
          console.log('Örnek antrenman planları, sessions ve hedefler eklendi');
        }, 1000);
        
        console.log('Örnek egzersizler, şablonlar ve şablon egzersizleri eklendi');
      }
    });
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icons', 'win', 'icon.ico'),
    show: false
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icons', 'win', 'icon.ico'),
    title: 'GymDesk - Spor Salonu Yönetim Sistemi',
    show: false
  });

  // Geliştirme modunda React dev server'ı kullan
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // React dev server'ın hazır olması için bekle
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 2000);
    mainWindow.webContents.openDevTools(); // Dev tools açık olsun
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    // Ana pencere hazır olduğunda splash'i kapat ve ana pencereyi göster
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Uygulama hazır olduğunda
app.whenReady().then(() => {
  createDatabase();
  createSplashWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashWindow();
    }
  });
});

// Tüm pencereler kapatıldığında uygulamayı kapat
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Uygulama kapanırken veritabanını kapat
app.on('before-quit', () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Veritabanı kapatma hatası:', err);
      } else {
        console.log('Veritabanı bağlantısı kapatıldı');
      }
    });
  }
});

// IPC handlers - React ile iletişim
ipcMain.handle('get-members', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM members ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-member', async (event, member) => {
  return new Promise((resolve, reject) => {
    const { name, surname, phone, email, birth_date, membership_type, start_date, end_date } = member;
    db.run(
      'INSERT INTO members (name, surname, phone, email, birth_date, membership_type, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, surname, phone, email, birth_date, membership_type, start_date, end_date],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...member });
        }
      }
    );
  });
});

ipcMain.handle('update-member', async (event, id, member) => {
  return new Promise((resolve, reject) => {
    const { name, surname, phone, email, birth_date, membership_type, start_date, end_date } = member;
    db.run(
      'UPDATE members SET name=?, surname=?, phone=?, email=?, birth_date=?, membership_type=?, start_date=?, end_date=? WHERE id=?',
      [name, surname, phone, email, birth_date, membership_type, start_date, end_date, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...member });
        }
      }
    );
  });
});

ipcMain.handle('delete-member', async (event, id) => {
  return new Promise((resolve, reject) => {
    // Transaction kullanarak tüm ilişkili verileri sil
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Önce üyeye ait plan egzersizlerini sil
      db.run(`DELETE FROM workout_plan_exercises 
              WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE member_id = ?)`, [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
      });
      
      // Sonra üyeye ait workout sessions'ı sil
      db.run('DELETE FROM workout_sessions WHERE member_id = ?', [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
      });
      
      // Sonra üyeye ait antrenman planlarını sil
      db.run('DELETE FROM workout_plans WHERE member_id = ?', [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
      });
      
      // Sonra üyeye ait ödemeleri sil
      db.run('DELETE FROM payments WHERE member_id = ?', [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
      });
      
      // Üyeye ait hedefleri sil
      db.run('DELETE FROM member_goals WHERE member_id = ?', [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
      });
      
      // Son olarak üyeyi sil
      db.run('DELETE FROM members WHERE id = ?', [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
        } else {
          db.run('COMMIT');
          resolve({ 
            success: true, 
            message: 'Üye ve tüm ilişkili veriler başarıyla silindi' 
          });
        }
      });
    });
  });
});

// Ödeme işlemleri
ipcMain.handle('get-payments', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT p.*, m.name, m.surname 
      FROM payments p 
      LEFT JOIN members m ON p.member_id = m.id 
      ORDER BY p.created_at DESC
    `, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-payment', async (event, payment) => {
  return new Promise((resolve, reject) => {
    const { member_id, amount, payment_date, payment_method } = payment;
    db.run(
      'INSERT INTO payments (member_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)',
      [member_id, amount, payment_date, payment_method],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...payment });
        }
      }
    );
  });
});

// Antrenman planları
ipcMain.handle('get-workout-plans', async (event, memberId) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT wp.*, m.name, m.surname, wt.name as template_name
      FROM workout_plans wp
      LEFT JOIN members m ON wp.member_id = m.id
      LEFT JOIN workout_templates wt ON wp.template_id = wt.id
    `;
    let params = [];
    
    if (memberId) {
      query += ' WHERE wp.member_id = ?';
      params.push(memberId);
    }
    
    query += ' ORDER BY wp.created_at DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-workout-plan', async (event, plan) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Önce workout plan'ı ekle
      db.run(
        `INSERT INTO workout_plans 
         (member_id, title, description, date, category, duration, difficulty, status, template_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [plan.member_id, plan.title, plan.description, plan.date, 
         plan.category || 'Genel', plan.duration || 60, plan.difficulty || 'Orta', 
         plan.status || 'Planlandi', plan.template_id || null],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          const newPlanId = this.lastID;
          
          // Eğer şablon seçilmişse, şablondaki egzersizleri kopyala
          if (plan.template_id) {
            db.all(`
              SELECT te.*, e.name, e.muscle_group, e.equipment
              FROM template_exercises te
              LEFT JOIN exercises e ON te.exercise_id = e.id
              WHERE te.template_id = ?
              ORDER BY te.order_index
            `, [plan.template_id], (err, templateExercises) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              if (templateExercises.length === 0) {
                // Şablonda egzersiz yok, sadece planı kaydet
                db.run('COMMIT');
                resolve({ id: newPlanId, exercisesCopied: 0 });
                return;
              }
              
              // Template egzersizlerini plan egzersizlerine kopyala
              let completed = 0;
              let hasError = false;
              
              templateExercises.forEach((templateExercise, index) => {
                db.run(
                  `INSERT INTO workout_plan_exercises 
                   (workout_plan_id, exercise_id, sets, reps, weight, rest_seconds, notes, order_index) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [newPlanId, templateExercise.exercise_id, templateExercise.sets, 
                   templateExercise.reps, templateExercise.weight, templateExercise.rest_seconds, 
                   templateExercise.notes, index + 1],
                  function(exerciseErr) {
                    if (exerciseErr && !hasError) {
                      hasError = true;
                      db.run('ROLLBACK');
                      reject(exerciseErr);
                      return;
                    }
                    
                    completed++;
                    if (completed === templateExercises.length && !hasError) {
                      db.run('COMMIT');
                      resolve({ 
                        id: newPlanId, 
                        exercisesCopied: templateExercises.length,
                        message: `Plan oluşturuldu ve ${templateExercises.length} egzersiz şablondan kopyalandı!`
                      });
                    }
                  }
                );
              });
            });
          } else {
            // Şablon seçilmemiş, sadece planı kaydet
            db.run('COMMIT');
            resolve({ id: newPlanId, exercisesCopied: 0 });
          }
        }
      );
    });
  });
});

// Antrenman şablonları işlemleri
ipcMain.handle('get-workout-templates', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT wt.*, 
             COUNT(te.id) as exercise_count
      FROM workout_templates wt
      LEFT JOIN template_exercises te ON wt.id = te.template_id
      GROUP BY wt.id
      ORDER BY wt.created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-workout-template', async (event, template) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO workout_templates (name, description, category, difficulty, duration) VALUES (?, ?, ?, ?, ?)',
      [template.name, template.description, template.category, template.difficulty, template.duration],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
});

ipcMain.handle('delete-workout-template', async (event, templateId) => {
  return new Promise((resolve, reject) => {
    // Önce bu şablonun herhangi bir planda kullanılıp kullanılmadığını kontrol et
    db.get('SELECT COUNT(*) as count FROM workout_plans WHERE template_id = ?', [templateId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row.count > 0) {
        reject(new Error('Bu şablon antrenman planlarında kullanıldığı için silinemiyor. Önce ilgili planları silin.'));
      } else {
        // Şablon hiçbir planda kullanılmıyorsa, önce şablon egzersizlerini sil, sonra şablonu sil
        db.serialize(() => {
          db.run('DELETE FROM template_exercises WHERE template_id = ?', [templateId], (err) => {
            if (err) {
              reject(err);
            } else {
              db.run('DELETE FROM workout_templates WHERE id = ?', [templateId], function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve({ deletedRows: this.changes });
                }
              });
            }
          });
        });
      }
    });
  });
});

// Template egzersizleri işlemleri
ipcMain.handle('get-template-exercises', async (event, templateId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT te.*, e.name, e.muscle_group, e.equipment, e.instructions
      FROM template_exercises te
      LEFT JOIN exercises e ON te.exercise_id = e.id
      WHERE te.template_id = ?
      ORDER BY te.order_index
    `, [templateId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-template-exercise', async (event, templateExercise) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO template_exercises 
       (template_id, exercise_id, sets, reps, weight, rest_seconds, notes, order_index) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [templateExercise.template_id, templateExercise.exercise_id, templateExercise.sets, 
       templateExercise.reps, templateExercise.weight, templateExercise.rest_seconds, 
       templateExercise.notes, templateExercise.order_index],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
});

ipcMain.handle('delete-template-exercise', async (event, exerciseId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM template_exercises WHERE id = ?',
      [exerciseId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deletedRows: this.changes });
        }
      }
    );
  });
});

// Egzersiz işlemleri
ipcMain.handle('get-exercises', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM exercises ORDER BY muscle_group, name', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-exercise', async (event, exercise) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO exercises (name, muscle_group, equipment, instructions) VALUES (?, ?, ?, ?)',
      [exercise.name, exercise.muscle_group, exercise.equipment, exercise.instructions],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
});

ipcMain.handle('delete-exercise', async (event, exerciseId) => {
  return new Promise((resolve, reject) => {
    // Önce bu egzersizin herhangi bir şablonda veya planda kullanılıp kullanılmadığını kontrol et
    db.get(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM template_exercises WHERE exercise_id = ?
        UNION ALL
        SELECT id FROM workout_plan_exercises WHERE exercise_id = ?
      )
    `, [exerciseId, exerciseId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row.count > 0) {
        reject(new Error('Bu egzersiz şablonlarda veya planlarda kullanıldığı için silinemiyor. Önce ilgili şablon ve planlardan kaldırın.'));
      } else {
        // Egzersiz hiçbir yerde kullanılmıyorsa sil
        db.run('DELETE FROM exercises WHERE id = ?', [exerciseId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ deletedRows: this.changes });
          }
        });
      }
    });
  });
});

// Plan egzersizleri işlemleri
ipcMain.handle('get-plan-exercises', async (event, planId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT wpe.*, e.name, e.muscle_group, e.equipment
      FROM workout_plan_exercises wpe
      LEFT JOIN exercises e ON wpe.exercise_id = e.id
      WHERE wpe.workout_plan_id = ?
      ORDER BY wpe.order_index
    `, [planId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-plan-exercise', async (event, planExercise) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO workout_plan_exercises 
       (workout_plan_id, exercise_id, sets, reps, weight, rest_seconds, notes, order_index) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [planExercise.workout_plan_id, planExercise.exercise_id, planExercise.sets, 
       planExercise.reps, planExercise.weight, planExercise.rest_seconds, 
       planExercise.notes, planExercise.order_index],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
});

ipcMain.handle('delete-plan-exercise', async (event, exerciseId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM workout_plan_exercises WHERE id = ?',
      [exerciseId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deletedRows: this.changes });
        }
      }
    );
  });
});

// Progress tracking
ipcMain.handle('complete-workout', async (event, sessionData) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO workout_sessions 
       (workout_plan_id, member_id, completed_at, duration, notes, rating) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionData.workout_plan_id, sessionData.member_id, sessionData.completed_at, 
       sessionData.duration, sessionData.notes, sessionData.rating],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // Antrenman planının durumunu güncelle
          db.run(
            'UPDATE workout_plans SET status = ? WHERE id = ?',
            ['Tamamlandi', sessionData.workout_plan_id],
            (updateErr) => {
              if (updateErr) {
                reject(updateErr);
              } else {
                resolve({ id: this.lastID });
              }
            }
          );
        }
      }
    );
  });
});

ipcMain.handle('get-workout-progress', async (event, memberId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT ws.*, wp.title, wp.category
      FROM workout_sessions ws
      LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
      WHERE ws.member_id = ?
      ORDER BY ws.completed_at DESC
    `, [memberId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// Progress analytics
ipcMain.handle('get-member-stats', async (event, memberId) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stats = {};
      
      // Toplam antrenman sayısı
      db.get(`
        SELECT COUNT(*) as total_workouts,
               AVG(duration) as avg_duration,
               AVG(rating) as avg_rating
        FROM workout_sessions 
        WHERE member_id = ?
      `, [memberId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        stats.totalWorkouts = row.total_workouts || 0;
        stats.avgDuration = Math.round(row.avg_duration || 0);
        stats.avgRating = parseFloat((row.avg_rating || 0).toFixed(1));
      });
      
      // Bu ay yapılan antrenman sayısı
      db.get(`
        SELECT COUNT(*) as monthly_workouts
        FROM workout_sessions 
        WHERE member_id = ? 
        AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now')
      `, [memberId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        stats.monthlyWorkouts = row.monthly_workouts || 0;
      });
      
      // Son 7 günde yapılan antrenman
      db.get(`
        SELECT COUNT(*) as weekly_workouts
        FROM workout_sessions 
        WHERE member_id = ? 
        AND datetime(completed_at) >= datetime('now', '-7 days')
      `, [memberId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        stats.weeklyWorkouts = row.weekly_workouts || 0;
      });
      
      // Kategori bazında antrenman sayıları
      db.all(`
        SELECT wp.category, COUNT(*) as count
        FROM workout_sessions ws
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        WHERE ws.member_id = ?
        GROUP BY wp.category
        ORDER BY count DESC
      `, [memberId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        stats.categoryBreakdown = rows;
        resolve(stats);
      });
    });
  });
});

// Genel gym istatistikleri
ipcMain.handle('get-gym-analytics', async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const analytics = {};
      
      // Genel istatistikler
      db.get(`
        SELECT 
          COUNT(DISTINCT ws.member_id) as active_members,
          COUNT(*) as total_sessions,
          AVG(ws.duration) as avg_duration,
          AVG(ws.rating) as avg_rating
        FROM workout_sessions ws
        WHERE datetime(ws.completed_at) >= datetime('now', '-30 days')
      `, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        analytics.activeMembers = row.active_members || 0;
        analytics.totalSessions = row.total_sessions || 0;
        analytics.avgDuration = Math.round(row.avg_duration || 0);
        analytics.avgRating = parseFloat((row.avg_rating || 0).toFixed(1));
      });
      
      // Son 30 günde günlük antrenman sayıları
      db.all(`
        SELECT 
          DATE(completed_at) as date,
          COUNT(*) as workout_count
        FROM workout_sessions
        WHERE datetime(completed_at) >= datetime('now', '-30 days')
        GROUP BY DATE(completed_at)
        ORDER BY date DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        analytics.dailyWorkouts = rows;
      });
      
      // Kategori bazında popülerlik
      db.all(`
        SELECT 
          wp.category,
          COUNT(*) as count,
          AVG(ws.rating) as avg_rating
        FROM workout_sessions ws
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        WHERE datetime(ws.completed_at) >= datetime('now', '-30 days')
        GROUP BY wp.category
        ORDER BY count DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        analytics.categoryPopularity = rows;
      });
      
      // En aktif üyeler
      db.all(`
        SELECT 
          m.name, m.surname, m.id,
          COUNT(*) as workout_count,
          AVG(ws.duration) as avg_duration
        FROM workout_sessions ws
        LEFT JOIN members m ON ws.member_id = m.id
        WHERE datetime(ws.completed_at) >= datetime('now', '-30 days')
        GROUP BY ws.member_id
        ORDER BY workout_count DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        analytics.topMembers = rows;
        resolve(analytics);
      });
    });
  });
});

// Hedef belirleme sistemi
ipcMain.handle('add-member-goal', async (event, goal) => {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO member_goals 
      (member_id, title, description, target_value, current_value, target_date, goal_type, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [goal.member_id, goal.title, goal.description, goal.target_value, 
        goal.current_value || 0, goal.target_date, goal.goal_type, 'Aktif'],
    function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
});

ipcMain.handle('get-member-goals', async (event, memberId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM member_goals 
      WHERE member_id = ? 
      ORDER BY created_at DESC
    `, [memberId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('update-goal-progress', async (event, goalId, currentValue) => {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE member_goals 
      SET current_value = ?, 
          status = CASE 
            WHEN ? >= target_value THEN 'Tamamlandi'
            ELSE 'Aktif'
          END
      WHERE id = ?
    `, [currentValue, currentValue, goalId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Body Measurements API Handlers
ipcMain.handle('add-body-measurement', async (event, measurement) => {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO body_measurements 
      (member_id, height, weight, body_fat_percentage, muscle_mass, chest, waist, hips, bicep, thigh, notes, measurement_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      measurement.member_id,
      measurement.height,
      measurement.weight,
      measurement.body_fat_percentage,
      measurement.muscle_mass,
      measurement.chest,
      measurement.waist,
      measurement.hips,
      measurement.bicep,
      measurement.thigh,
      measurement.notes,
      measurement.measurement_date
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, success: true });
      }
    });
  });
});

ipcMain.handle('get-body-measurements', async (event, memberId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT bm.*, m.name, m.surname 
      FROM body_measurements bm
      LEFT JOIN members m ON bm.member_id = m.id
      WHERE bm.member_id = ?
      ORDER BY bm.measurement_date DESC
    `, [memberId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('get-all-body-measurements', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT bm.*, m.name, m.surname 
      FROM body_measurements bm
      LEFT JOIN members m ON bm.member_id = m.id
      ORDER BY bm.measurement_date DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('update-body-measurement', async (event, id, measurement) => {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE body_measurements 
      SET height = ?, weight = ?, body_fat_percentage = ?, muscle_mass = ?, 
          chest = ?, waist = ?, hips = ?, bicep = ?, thigh = ?, 
          notes = ?, measurement_date = ?
      WHERE id = ?
    `, [
      measurement.height,
      measurement.weight,
      measurement.body_fat_percentage,
      measurement.muscle_mass,
      measurement.chest,
      measurement.waist,
      measurement.hips,
      measurement.bicep,
      measurement.thigh,
      measurement.notes,
      measurement.measurement_date,
      id
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('delete-body-measurement', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM body_measurements WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('get-member-measurement-history', async (event, memberId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM body_measurements 
      WHERE member_id = ?
      ORDER BY measurement_date ASC
    `, [memberId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// Splash screen handler
ipcMain.handle('splash-finished', async () => {
  if (!mainWindow) {
    createMainWindow();
  }
  return { success: true };
}); 