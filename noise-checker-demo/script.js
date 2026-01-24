// グローバル変数
let isRecording = false;
let recordingInterval = null;
let duration = 0;
let currentDb = 0;
let maxDb = 0;
let minDb = 100;
let dbHistory = [];

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initChart();
});

// 画面遷移
function navigateTo(screenName) {
    // すべての画面を非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // 指定された画面を表示
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // ナビゲーションボタンのアクティブ状態を更新
    document.querySelectorAll('.nav-button').forEach((btn, index) => {
        btn.classList.remove('active');
        if (
            (screenName === 'home' && index === 0) ||
            (screenName === 'history' && index === 1) ||
            (screenName === 'settings' && index === 2)
        ) {
            btn.classList.add('active');
        }
    });
}

// 測定開始/停止
document.getElementById('recordButton').addEventListener('click', () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    isRecording = true;
    duration = 0;
    currentDb = 0;
    maxDb = 0;
    minDb = 100;
    dbHistory = [];

    // ボタンの表示を変更
    const button = document.getElementById('recordButton');
    button.innerHTML = '<span class="material-icons">stop</span><span>測定停止</span>';
    button.classList.remove('start-button');
    button.classList.add('stop-button');

    // 統計表示を表示
    document.getElementById('statsContainer').style.display = 'flex';

    // インフォテキストを更新
    document.getElementById('infoText').textContent = '周囲の騒音レベルをリアルタイムで測定中です';

    // メーターにrecordingクラスを追加
    document.getElementById('dbCircle').classList.add('recording');

    // 測定シミュレーション開始
    recordingInterval = setInterval(() => {
        duration++;
        updateDuration();
        simulateMeasurement();
    }, 1000);
}

function stopRecording() {
    isRecording = false;

    // インターバルをクリア
    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }

    // ボタンの表示を戻す
    const button = document.getElementById('recordButton');
    button.innerHTML = '<span class="material-icons">mic</span><span>測定開始</span>';
    button.classList.remove('stop-button');
    button.classList.add('start-button');

    // メーターからrecordingクラスを削除
    document.getElementById('dbCircle').classList.remove('recording');

    // インフォテキストを更新
    document.getElementById('infoText').textContent = 'マイクボタンを押して測定を開始してください';

    // 結果画面に遷移
    setTimeout(() => {
        navigateTo('result');
        updateChart();
    }, 500);
}

function simulateMeasurement() {
    // ランダムなdB値を生成（よりリアルな変動）
    const baseDb = 45 + Math.random() * 30; // 45-75の範囲
    const variation = (Math.random() - 0.5) * 10; // ±5の変動
    currentDb = Math.max(20, Math.min(90, baseDb + variation));

    // 最大値・最小値を更新
    maxDb = Math.max(maxDb, currentDb);
    minDb = Math.min(minDb, currentDb);

    // 履歴に追加
    dbHistory.push(currentDb);

    // 平均値を計算
    const avgDb = dbHistory.reduce((sum, db) => sum + db, 0) / dbHistory.length;

    // UIを更新
    updateMeter(currentDb);
    updateStats(maxDb, minDb, avgDb);
}

function updateMeter(db) {
    const dbValue = document.getElementById('dbValue');
    const dbCircle = document.getElementById('dbCircle');
    const levelIcon = document.getElementById('levelIcon');
    const levelText = document.getElementById('levelText');

    // dB値を表示
    dbValue.textContent = db.toFixed(1);

    // レベルに応じて色とアイコンを変更
    let color, icon, text;

    if (db < 40) {
        color = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
        icon = '🟢';
        text = '静か';
    } else if (db < 60) {
        color = 'linear-gradient(135deg, #fdd835 0%, #f9a825 100%)';
        icon = '🟡';
        text = 'やや騒音';
    } else if (db < 80) {
        color = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        icon = '🟠';
        text = '騒がしい';
    } else {
        color = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        icon = '🔴';
        text = '非常に騒がしい';
    }

    dbCircle.style.background = color;
    levelIcon.textContent = icon;
    levelText.textContent = text;
}

function updateStats(max, min, avg) {
    document.getElementById('maxDb').textContent = `${max.toFixed(1)} dB`;
    document.getElementById('minDb').textContent = `${min.toFixed(1)} dB`;
    document.getElementById('avgDb').textContent = `${avg.toFixed(1)} dB`;
}

function updateDuration() {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('duration').textContent = formattedTime;
}

// グラフ関連
let chart = null;

function initChart() {
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');

    // キャンバスのサイズを設定
    canvas.width = canvas.offsetWidth * 2; // Retinaディスプレイ対応
    canvas.height = 400;

    // 初期グラフを描画
    drawChart(ctx, canvas.width, canvas.height);
}

function updateChart() {
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');
    drawChart(ctx, canvas.width, canvas.height, dbHistory);
}

function drawChart(ctx, width, height, data = []) {
    // データがない場合はサンプルデータを使用
    if (data.length === 0) {
        data = generateSampleData(30);
    }

    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);

    // 背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // グリッド線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // 横線（dBレベル）
    for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // ラベル
        const dbValue = 100 - (i * 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '24px sans-serif';
        ctx.fillText(`${dbValue}dB`, 10, y - 10);
    }

    // 縦線（時間）
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
        const x = (width / timeSteps) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // データポイントを描画
    if (data.length > 0) {
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 4;
        ctx.beginPath();

        const xStep = width / (data.length - 1);

        data.forEach((db, index) => {
            const x = index * xStep;
            const y = height - ((db / 100) * height);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // エリアを塗りつぶし
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(79, 195, 247, 0.2)';
        ctx.fill();

        // データポイント
        ctx.fillStyle = '#4fc3f7';
        data.forEach((db, index) => {
            const x = index * xStep;
            const y = height - ((db / 100) * height);
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

function generateSampleData(count) {
    const data = [];
    let currentValue = 50;

    for (let i = 0; i < count; i++) {
        currentValue += (Math.random() - 0.5) * 10;
        currentValue = Math.max(30, Math.min(80, currentValue));
        data.push(currentValue);
    }

    return data;
}

// フィルターボタンの動作
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
    });
});

// ラジオボタンの動作
document.querySelectorAll('.radio-item').forEach(item => {
    item.addEventListener('click', function() {
        const parent = this.parentElement;
        parent.querySelectorAll('.radio-item').forEach(radio => {
            radio.classList.remove('active');
            const inner = radio.querySelector('.radio-inner');
            if (inner) inner.remove();
        });
        this.classList.add('active');
        const circle = this.querySelector('.radio-circle');
        if (!circle.querySelector('.radio-inner')) {
            const inner = document.createElement('div');
            inner.className = 'radio-inner';
            circle.appendChild(inner);
        }
    });
});

// 履歴アイテムのクリック
document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
        navigateTo('result');
    });
});

// デモ用の自動アニメーション（オプション）
function startDemoAnimation() {
    // メーターのアニメーション
    setInterval(() => {
        if (!isRecording) {
            const demoDb = 30 + Math.random() * 20;
            updateMeter(demoDb);
        }
    }, 2000);
}

// デモアニメーションを開始（コメントアウトを外すと有効化）
// startDemoAnimation();

console.log('ZENBU騒音チェッカー - デモ版を起動しました');
console.log('測定ボタンをクリックして、デモ測定を体験してください');
