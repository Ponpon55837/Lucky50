/**
 * Lucky50 - 投資分析器
 * 處理 0050 ETF 相關數據分析
 */

class InvestmentAnalyzer {
    constructor() {
        this.etfData = this.generateMockETFData();
        this.marketHours = {
            open: 9,
            close: 13.5
        };
    }

    /**
     * 生成模擬 0050 ETF 數據
     */
    generateMockETFData() {
        const basePrice = 165.50;
        const data = [];
        const now = new Date();
        
        // 生成過去30天的數據
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // 模擬價格波動（±3%）
            const variation = (Math.random() - 0.5) * 0.06;
            const price = basePrice * (1 + variation);
            const volume = Math.floor(Math.random() * 50000 + 10000);
            
            data.push({
                date: date.toISOString().split('T')[0],
                open: price * (1 + (Math.random() - 0.5) * 0.01),
                high: price * (1 + Math.random() * 0.02),
                low: price * (1 - Math.random() * 0.02),
                close: price,
                volume: volume
            });
        }
        
        return data;
    }

    /**
     * 獲取當前 ETF 資訊
     */
    getCurrentETFInfo() {
        const latestData = this.etfData[this.etfData.length - 1];
        const previousData = this.etfData[this.etfData.length - 2];
        
        const change = latestData.close - previousData.close;
        const changePercent = (change / previousData.close) * 100;
        
        return {
            symbol: '0050',
            name: '元大台灣50',
            currentPrice: latestData.close.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            volume: latestData.volume.toLocaleString(),
            high52Week: Math.max(...this.etfData.map(d => d.high)).toFixed(2),
            low52Week: Math.min(...this.etfData.map(d => d.low)).toFixed(2),
            marketCap: '1.2兆台幣',
            dividend: '3.2%',
            expenseRatio: '0.43%'
        };
    }

    /**
     * 計算技術指標
     */
    calculateTechnicalIndicators() {
        const prices = this.etfData.map(d => d.close);
        
        return {
            sma5: this.calculateSMA(prices, 5),
            sma10: this.calculateSMA(prices, 10),
            sma20: this.calculateSMA(prices, 20),
            rsi: this.calculateRSI(prices, 14),
            macd: this.calculateMACD(prices),
            bollinger: this.calculateBollingerBands(prices, 20)
        };
    }

    /**
     * 計算簡單移動平均線
     */
    calculateSMA(prices, period) {
        if (prices.length < period) return null;
        
        const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
        return (sum / period).toFixed(2);
    }

    /**
     * 計算 RSI
     */
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }
        
        const recentChanges = changes.slice(-period);
        const gains = recentChanges.filter(change => change > 0);
        const losses = recentChanges.filter(change => change < 0).map(loss => -loss);
        
        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return rsi.toFixed(2);
    }

    /**
     * 計算 MACD
     */
    calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        
        if (!ema12 || !ema26) return null;
        
        const macd = ema12 - ema26;
        const signal = this.calculateEMA([macd], 9);
        const histogram = macd - (signal || 0);
        
        return {
            macd: macd.toFixed(2),
            signal: (signal || 0).toFixed(2),
            histogram: histogram.toFixed(2)
        };
    }

    /**
     * 計算指數移動平均線
     */
    calculateEMA(prices, period) {
        if (prices.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }

    /**
     * 計算布林通道
     */
    calculateBollingerBands(prices, period = 20) {
        if (prices.length < period) return null;
        
        const recentPrices = prices.slice(-period);
        const sma = recentPrices.reduce((acc, price) => acc + price, 0) / period;
        
        const variance = recentPrices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        return {
            upper: (sma + standardDeviation * 2).toFixed(2),
            middle: sma.toFixed(2),
            lower: (sma - standardDeviation * 2).toFixed(2)
        };
    }

    /**
     * 根據運勢分析生成投資建議
     */
    generateInvestmentAdvice(fortuneScore, technicalIndicators) {
        const advice = {
            action: '',
            reasoning: [],
            technicalSignals: [],
            riskWarnings: [],
            targets: {},
            timeframe: ''
        };

        // 基於運勢分數的基本建議
        if (fortuneScore >= 80) {
            advice.action = '強力買進';
            advice.reasoning.push('運勢分析顯示今日投資運勢極佳');
            advice.timeframe = '短期內（1-3天）';
        } else if (fortuneScore >= 60) {
            advice.action = '適度買進';
            advice.reasoning.push('運勢分析顯示投資時機良好');
            advice.timeframe = '中短期（3-7天）';
        } else if (fortuneScore >= 40) {
            advice.action = '觀望';
            advice.reasoning.push('運勢分析顯示投資時機普通');
            advice.timeframe = '等待更好時機';
        } else {
            advice.action = '暫停投資';
            advice.reasoning.push('運勢分析顯示不適合投資');
            advice.timeframe = '等待運勢轉佳';
        }

        // 技術分析建議
        if (technicalIndicators.rsi) {
            const rsi = parseFloat(technicalIndicators.rsi);
            if (rsi > 70) {
                advice.technicalSignals.push('RSI顯示超買，注意回調風險');
                advice.riskWarnings.push('技術面顯示可能過熱');
            } else if (rsi < 30) {
                advice.technicalSignals.push('RSI顯示超賣，可能反彈');
                if (fortuneScore >= 50) {
                    advice.reasoning.push('技術面配合運勢面，買點浮現');
                }
            } else {
                advice.technicalSignals.push('RSI處於正常範圍');
            }
        }

        // 移動平均線分析
        const currentPrice = parseFloat(this.getCurrentETFInfo().currentPrice);
        if (technicalIndicators.sma20) {
            const sma20 = parseFloat(technicalIndicators.sma20);
            if (currentPrice > sma20) {
                advice.technicalSignals.push('價格位於20日均線之上，趨勢正面');
            } else {
                advice.technicalSignals.push('價格位於20日均線之下，趨勢偏弱');
                advice.riskWarnings.push('短期趨勢偏弱，須謹慎');
            }
        }

        // 設定目標價位
        if (advice.action.includes('買進')) {
            advice.targets = {
                entry: currentPrice.toFixed(2),
                stopLoss: (currentPrice * 0.95).toFixed(2),
                target1: (currentPrice * 1.05).toFixed(2),
                target2: (currentPrice * 1.10).toFixed(2)
            };
        }

        return advice;
    }

    /**
     * 獲取市場情緒指標
     */
    getMarketSentiment() {
        const recentReturns = [];
        for (let i = 1; i < this.etfData.length; i++) {
            const returnRate = (this.etfData[i].close - this.etfData[i-1].close) / this.etfData[i-1].close;
            recentReturns.push(returnRate);
        }

        const avgReturn = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
        const volatility = Math.sqrt(
            recentReturns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / recentReturns.length
        );

        let sentiment, color;
        if (avgReturn > 0.002) {
            sentiment = '樂觀';
            color = '#10B981';
        } else if (avgReturn > -0.002) {
            sentiment = '中性';
            color = '#6B7280';
        } else {
            sentiment = '悲觀';
            color = '#EF4444';
        }

        return {
            sentiment,
            color,
            volatility: (volatility * 100).toFixed(2) + '%',
            trend: avgReturn > 0 ? '上升' : '下降',
            strength: Math.abs(avgReturn * 1000).toFixed(1)
        };
    }

    /**
     * 檢查是否為交易時間
     */
    isMarketOpen() {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;
        const day = now.getDay();
        
        return day >= 1 && day <= 5 && hour >= this.marketHours.open && hour <= this.marketHours.close;
    }

    /**
     * 獲取下一個交易日
     */
    getNextTradingDay() {
        const now = new Date();
        const next = new Date(now);
        
        do {
            next.setDate(next.getDate() + 1);
        } while (next.getDay() === 0 || next.getDay() === 6);
        
        return next;
    }

    /**
     * 生成投資報告
     */
    generateInvestmentReport(fortuneAnalysis) {
        const etfInfo = this.getCurrentETFInfo();
        const technicalIndicators = this.calculateTechnicalIndicators();
        const advice = this.generateInvestmentAdvice(fortuneAnalysis.overallScore, technicalIndicators);
        const sentiment = this.getMarketSentiment();

        return {
            timestamp: new Date().toISOString(),
            etfInfo,
            technicalIndicators,
            advice,
            sentiment,
            fortuneScore: fortuneAnalysis.overallScore,
            marketOpen: this.isMarketOpen(),
            nextTradingDay: this.getNextTradingDay().toLocaleDateString('zh-TW')
        };
    }
}

// 導出類別
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvestmentAnalyzer;
} else {
    window.InvestmentAnalyzer = InvestmentAnalyzer;
}