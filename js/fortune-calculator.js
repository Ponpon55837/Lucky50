/**
 * Lucky50 - 運勢計算器
 * 整合各種運勢計算方法
 */

class FortuneCalculator {
    constructor() {
        this.lunarCalendar = new LunarCalendar();
        
        // 五行相生相克關係
        this.elementRelations = {
            generate: {
                '木': '火',
                '火': '土',
                '土': '金',
                '金': '水',
                '水': '木'
            },
            overcome: {
                '木': '土',
                '火': '金',
                '土': '水',
                '金': '木',
                '水': '火'
            }
        };
        
        // 投資建議模板
        this.investmentTemplates = {
            高: {
                action: '積極買進',
                timing: '適合大幅加碼',
                risk: '低風險期',
                confidence: 85
            },
            中高: {
                action: '適度買進',
                timing: '可以逢低佈局',
                risk: '中低風險期',
                confidence: 70
            },
            中: {
                action: '謹慎觀察',
                timing: '維持現有部位',
                risk: '中等風險期',
                confidence: 50
            },
            中低: {
                action: '小幅減碼',
                timing: '等待更好時機',
                risk: '中高風險期',
                confidence: 30
            },
            低: {
                action: '暫停投資',
                timing: '現金為王',
                risk: '高風險期',
                confidence: 15
            }
        };
    }

    /**
     * 綜合運勢分析
     */
    calculateComprehensiveFortune(birthDate, birthTime, zodiac) {
        // 獲取八字信息
        const baZi = this.lunarCalendar.getBaZi(new Date(birthDate), birthTime);
        
        // 獲取今日運勢
        const todayFortune = this.lunarCalendar.getTodayFortune();
        
        // 獲取生肖相性
        const zodiacCompatibility = this.lunarCalendar.getZodiacInvestmentCompatibility(zodiac);
        
        // 計算五行平衡
        const elementBalance = this.calculateElementBalance(baZi);
        
        // 計算整體運勢分數
        const overallScore = this.calculateOverallScore(
            todayFortune.score,
            zodiacCompatibility.compatibility,
            elementBalance.score
        );
        
        return {
            baZi,
            todayFortune,
            zodiacCompatibility,
            elementBalance,
            overallScore,
            recommendation: this.getInvestmentRecommendation(overallScore)
        };
    }

    /**
     * 計算五行平衡
     */
    calculateElementBalance(baZi) {
        const elements = {};
        
        // 統計八字中的五行分佈
        Object.values(baZi).forEach(pillar => {
            const element = pillar.element;
            elements[element] = (elements[element] || 0) + 1;
        });
        
        // 計算平衡度（標準差越小越平衡）
        const values = Object.values(elements);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);
        
        // 轉換為分數（0-100，100為最平衡）
        const balanceScore = Math.max(0, 100 - standardDeviation * 30);
        
        return {
            elements,
            balanceScore,
            score: balanceScore,
            dominantElement: this.getDominantElement(elements),
            advice: this.getElementAdvice(elements)
        };
    }

    /**
     * 獲取主導五行
     */
    getDominantElement(elements) {
        return Object.keys(elements).reduce((a, b) => elements[a] > elements[b] ? a : b);
    }

    /**
     * 根據五行分佈給出建議
     */
    getElementAdvice(elements) {
        const dominant = this.getDominantElement(elements);
        
        const adviceMap = {
            '金': '金性主收斂，適合穩健投資策略',
            '木': '木性主生長，適合成長型投資',
            '水': '水性主流動，適合靈活調整投資組合',
            '火': '火性主積極，適合主動投資策略',
            '土': '土性主穩定，適合長期持有策略'
        };
        
        return adviceMap[dominant] || '五行平衡，適合多元化投資';
    }

    /**
     * 計算整體運勢分數
     */
    calculateOverallScore(dailyScore, zodiacScore, elementScore) {
        // 加權平均
        const weights = {
            daily: 0.4,      // 今日運勢權重40%
            zodiac: 0.3,     // 生肖相性權重30%
            element: 0.3     // 五行平衡權重30%
        };
        
        return Math.round(
            dailyScore * weights.daily +
            zodiacScore * weights.zodiac +
            elementScore * weights.element
        );
    }

    /**
     * 根據分數獲取投資建議等級
     */
    getScoreLevel(score) {
        if (score >= 80) return '高';
        if (score >= 65) return '中高';
        if (score >= 50) return '中';
        if (score >= 35) return '中低';
        return '低';
    }

    /**
     * 獲取投資建議
     */
    getInvestmentRecommendation(score) {
        const level = this.getScoreLevel(score);
        const template = this.investmentTemplates[level];
        
        return {
            score,
            level,
            ...template,
            detailedAdvice: this.generateDetailedAdvice(score, level),
            riskLevel: this.calculateRiskLevel(score),
            suggestedPosition: this.calculateSuggestedPosition(score)
        };
    }

    /**
     * 生成詳細建議
     */
    generateDetailedAdvice(score, level) {
        const timeOfDay = new Date().getHours();
        const isMarketHours = timeOfDay >= 9 && timeOfDay <= 13.5;
        
        let advice = [];
        
        if (level === '高') {
            advice.push('🌟 今日運勢極佳，適合積極投資 0050 ETF');
            advice.push('💰 建議增加投資部位，把握良機');
            if (isMarketHours) {
                advice.push('⏰ 現在正值交易時段，可考慮進場');
            }
        } else if (level === '中高') {
            advice.push('📈 今日運勢良好，可適度加碼 0050 ETF');
            advice.push('🎯 建議分批買進，降低風險');
        } else if (level === '中') {
            advice.push('⚖️ 今日運勢平穩，維持現有投資部位');
            advice.push('👀 密切關注市場動態，伺機而動');
        } else if (level === '中低') {
            advice.push('⚠️ 今日運勢略差，建議謹慎投資');
            advice.push('📉 可考慮小幅減碼，保留現金');
        } else {
            advice.push('🛑 今日運勢不佳，建議暫停投資');
            advice.push('💵 現金為王，等待更好的投資時機');
        }
        
        return advice;
    }

    /**
     * 計算風險等級
     */
    calculateRiskLevel(score) {
        if (score >= 80) return { level: '低', color: '#10B981' };
        if (score >= 65) return { level: '中低', color: '#F59E0B' };
        if (score >= 50) return { level: '中等', color: '#6B7280' };
        if (score >= 35) return { level: '中高', color: '#F97316' };
        return { level: '高', color: '#EF4444' };
    }

    /**
     * 建議投資部位
     */
    calculateSuggestedPosition(score) {
        const basePosition = Math.max(0, Math.min(100, score));
        
        return {
            percentage: basePosition,
            description: this.getPositionDescription(basePosition)
        };
    }

    /**
     * 獲取部位描述
     */
    getPositionDescription(percentage) {
        if (percentage >= 80) return '大幅加碼 (建議 80-100% 資金投入)';
        if (percentage >= 60) return '適度加碼 (建議 60-80% 資金投入)';
        if (percentage >= 40) return '標準配置 (建議 40-60% 資金投入)';
        if (percentage >= 20) return '保守配置 (建議 20-40% 資金投入)';
        return '現金為主 (建議 0-20% 資金投入)';
    }

    /**
     * 生成每日運勢摘要
     */
    generateDailySummary(fortune) {
        const today = new Date();
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];
        
        return {
            date: `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 (週${weekday})`,
            lunarDate: fortune.todayFortune.date,
            stemBranch: fortune.todayFortune.stemBranch,
            element: fortune.todayFortune.element,
            fortune: fortune.todayFortune.fortune,
            score: fortune.overallScore,
            zodiacMatch: fortune.zodiacCompatibility.compatibility,
            elementBalance: Math.round(fortune.elementBalance.balanceScore),
            mainAdvice: fortune.recommendation.detailedAdvice[0] || '今日宜謹慎投資'
        };
    }
}

// 導出類別
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FortuneCalculator;
} else {
    window.FortuneCalculator = FortuneCalculator;
}