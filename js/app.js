/**
 * Lucky50 - 主應用程式
 * 整合所有功能模組的主控制器
 */

class Lucky50App {
    constructor() {
        this.fortuneCalculator = new FortuneCalculator();
        this.investmentAnalyzer = new InvestmentAnalyzer();
        this.fortuneSphere = null;
        this.chart = null;
        
        this.initializeApp();
    }

    /**
     * 初始化應用程式
     */
    initializeApp() {
        // 等待 DOM 載入完成
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.displayWelcomeMessage();
            this.loadDemoData();
        });
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeFortune());
        }

        // 設定輸入欄位的即時驗證
        const birthDate = document.getElementById('birthDate');
        const birthTime = document.getElementById('birthTime');
        const zodiac = document.getElementById('zodiac');

        [birthDate, birthTime, zodiac].forEach(element => {
            if (element) {
                element.addEventListener('change', () => this.validateInputs());
            }
        });

        // 設定預設的出生日期為今天
        if (birthDate) {
            const today = new Date();
            const year = today.getFullYear() - 25; // 預設25歲
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            birthDate.value = `${year}-${month}-${day}`;
        }
    }

    /**
     * 驗證輸入欄位
     */
    validateInputs() {
        const birthDate = document.getElementById('birthDate').value;
        const birthTime = document.getElementById('birthTime').value;
        const zodiac = document.getElementById('zodiac').value;
        const analyzeBtn = document.getElementById('analyzeBtn');

        const isValid = birthDate && birthTime && zodiac;
        
        if (analyzeBtn) {
            analyzeBtn.disabled = !isValid;
            analyzeBtn.style.opacity = isValid ? '1' : '0.6';
            analyzeBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
        }

        return isValid;
    }

    /**
     * 顯示歡迎訊息
     */
    displayWelcomeMessage() {
        const now = new Date();
        const hour = now.getHours();
        let greeting;

        if (hour < 6) {
            greeting = '夜深了，';
        } else if (hour < 12) {
            greeting = '早安，';
        } else if (hour < 18) {
            greeting = '午安，';
        } else {
            greeting = '晚安，';
        }

        console.log(`${greeting}歡迎使用 Lucky50 農民曆智慧投資平台！`);
    }

    /**
     * 載入示範數據
     */
    loadDemoData() {
        // 可以在這裡預載一些示範數據或快取常用資訊
        console.log('Loading demo data...');
    }

    /**
     * 主要分析功能
     */
    async analyzeFortune() {
        if (!this.validateInputs()) {
            alert('請填寫完整的個人資料');
            return;
        }

        const analyzeBtn = document.getElementById('analyzeBtn');
        const originalText = analyzeBtn.textContent;
        
        try {
            // 顯示載入狀態
            analyzeBtn.innerHTML = '<span class="loading"></span> 分析中...';
            analyzeBtn.disabled = true;

            // 獲取輸入數據
            const birthDate = document.getElementById('birthDate').value;
            const birthTime = document.getElementById('birthTime').value;
            const zodiac = document.getElementById('zodiac').value;

            // 模擬分析過程
            await this.delay(2000);

            // 計算綜合運勢
            const fortuneAnalysis = this.fortuneCalculator.calculateComprehensiveFortune(
                birthDate, birthTime, zodiac
            );

            // 生成投資報告
            const investmentReport = this.investmentAnalyzer.generateInvestmentReport(fortuneAnalysis);

            // 顯示結果
            this.displayResults(fortuneAnalysis, investmentReport);

        } catch (error) {
            console.error('分析過程發生錯誤:', error);
            alert('分析過程發生錯誤，請稍後再試');
        } finally {
            // 恢復按鈕狀態
            analyzeBtn.innerHTML = originalText;
            analyzeBtn.disabled = false;
        }
    }

    /**
     * 顯示分析結果
     */
    displayResults(fortuneAnalysis, investmentReport) {
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) return;

        // 顯示結果區域
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');

        // 滾動到結果區域
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 更新各個顯示區域
        this.displayFortuneResult(fortuneAnalysis);
        this.displayInvestmentResult(investmentReport);
        this.createFortuneSphere(fortuneAnalysis.overallScore);
        this.createInvestmentChart(investmentReport);
    }

    /**
     * 顯示運勢結果
     */
    displayFortuneResult(fortuneAnalysis) {
        const fortuneResult = document.getElementById('fortuneResult');
        if (!fortuneResult) return;

        const summary = this.fortuneCalculator.generateDailySummary(fortuneAnalysis);
        const { todayFortune, zodiacCompatibility, elementBalance } = fortuneAnalysis;

        fortuneResult.innerHTML = `
            <div class="fortune-summary-header">
                <h3>📅 ${summary.date}</h3>
                <p>農曆 ${summary.lunarDate} | ${summary.stemBranch}日 (${summary.element})</p>
            </div>
            
            <div class="fortune-items">
                <div class="fortune-item">
                    <span class="fortune-label">🌟 整體運勢:</span>
                    <span class="fortune-value" style="color: ${todayFortune.color}">
                        ${todayFortune.fortune} (${summary.score}分)
                    </span>
                </div>
                
                <div class="fortune-item">
                    <span class="fortune-label">🐲 生肖相配:</span>
                    <span class="fortune-value">
                        ${zodiacCompatibility.compatibility}分
                    </span>
                </div>
                
                <div class="fortune-item">
                    <span class="fortune-label">⚖️ 五行平衡:</span>
                    <span class="fortune-value">
                        ${Math.round(elementBalance.balanceScore)}分
                    </span>
                </div>
            </div>
            
            <div class="fortune-advice">
                <h4>💡 今日建議</h4>
                <p>${summary.mainAdvice}</p>
                <div class="activities">
                    <div class="suitable">
                        <strong>宜:</strong> ${todayFortune.activities.suitable.join('、')}
                    </div>
                    <div class="unsuitable">
                        <strong>忌:</strong> ${todayFortune.activities.unsuitable.join('、')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 顯示投資建議結果
     */
    displayInvestmentResult(investmentReport) {
        const investmentResult = document.getElementById('investmentResult');
        if (!investmentResult) return;

        const { etfInfo, advice, sentiment } = investmentReport;

        investmentResult.innerHTML = `
            <div class="investment-header">
                <h3>💰 ${etfInfo.symbol} ${etfInfo.name}</h3>
                <div class="current-price">
                    <span class="price">NT$ ${etfInfo.currentPrice}</span>
                    <span class="change ${parseFloat(etfInfo.change) >= 0 ? 'positive' : 'negative'}">
                        ${parseFloat(etfInfo.change) >= 0 ? '+' : ''}${etfInfo.change} (${etfInfo.changePercent}%)
                    </span>
                </div>
            </div>

            <div class="investment-score">
                投資建議指數: ${investmentReport.fortuneScore}分
            </div>

            <div class="investment-recommendation">
                <h4>🎯 投資建議</h4>
                <div class="action-item">
                    <strong>操作建議:</strong> ${advice.action}
                </div>
                <div class="action-item">
                    <strong>建議部位:</strong> ${advice.suggestedPosition ? advice.suggestedPosition.description : '評估中'}
                </div>
                <div class="action-item">
                    <strong>時間框架:</strong> ${advice.timeframe}
                </div>
            </div>

            <div class="detailed-advice">
                <h4>📝 詳細分析</h4>
                ${advice.detailedAdvice && advice.detailedAdvice.length > 0 ? 
                  advice.detailedAdvice.map(item => `<p>• ${item}</p>`).join('') :
                  '<p>• 詳細分析處理中...</p>'
                }
            </div>

            <div class="market-info">
                <div class="market-item">
                    <span>市場情緒:</span>
                    <span style="color: ${sentiment.color}">${sentiment.sentiment}</span>
                </div>
                <div class="market-item">
                    <span>交易狀態:</span>
                    <span>${investmentReport.marketOpen ? '🟢 開市中' : '🔴 休市'}</span>
                </div>
                <div class="market-item">
                    <span>波動率:</span>
                    <span>${sentiment.volatility}</span>
                </div>
            </div>
        `;
    }

    /**
     * 創建 3D 運勢球
     */
    createFortuneSphere(score) {
        // 如果已存在球體，先銷毀
        if (this.fortuneSphere) {
            this.fortuneSphere.destroy();
        }

        // 創建新的運勢球
        this.fortuneSphere = new FortuneSphere('fortuneSphere');
        
        // 延遲更新以確保球體已初始化
        setTimeout(() => {
            if (this.fortuneSphere) {
                this.fortuneSphere.updateFortune(score);
            }
        }, 1000);
    }

    /**
     * 創建投資圖表
     */
    createInvestmentChart(investmentReport) {
        const canvas = document.getElementById('investmentChart');
        if (!canvas) return;

        // 銷毀現有圖表
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = canvas.getContext('2d');
        const etfData = this.investmentAnalyzer.etfData;

        // 準備圖表數據
        const labels = etfData.slice(-14).map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const prices = etfData.slice(-14).map(d => d.close);
        const volumes = etfData.slice(-14).map(d => d.volume);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '0050 收盤價',
                        data: prices,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: '成交量',
                        data: volumes,
                        type: 'bar',
                        backgroundColor: 'rgba(255, 107, 107, 0.3)',
                        borderColor: '#ff6b6b',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '0050 ETF 近期走勢',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '價格 (NT$)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '成交量'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 延遲執行輔助函數
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 應用程式銷毀清理
     */
    destroy() {
        if (this.fortuneSphere) {
            this.fortuneSphere.destroy();
        }
        
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

// 初始化應用程式
const app = new Lucky50App();