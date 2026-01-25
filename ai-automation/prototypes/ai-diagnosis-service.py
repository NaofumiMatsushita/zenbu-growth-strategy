"""
ZENBU AI Diagnosis Service
症状から騒音の種類・緊急度・見積もりを自動判定

機能:
- 症状の自然言語処理
- 緊急度判定
- 法的リスク評価
- 価格見積もり生成
- 対策提案
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import openai
import os
from datetime import datetime
import json

app = FastAPI(title="AI Diagnosis Service")

# OpenAI API設定
openai.api_key = os.getenv("OPENAI_API_KEY")


class Symptoms(BaseModel):
    """症状データモデル"""
    description: Optional[str] = None
    noise_type: Optional[str] = None
    time_of_day: Optional[str] = None
    duration_weeks: Optional[int] = None
    frequency: Optional[str] = None
    source_location: Optional[str] = None
    impact_level: Optional[str] = None
    contacted_management: Optional[bool] = None


class DiagnosisRequest(BaseModel):
    """診断リクエスト"""
    session_id: str
    customer_id: Optional[str] = None
    symptoms: Symptoms


class DiagnosisResponse(BaseModel):
    """診断結果"""
    diagnosis_id: str
    noise_type: str
    urgency: str = Field(..., description="low, medium, high")
    legal_risk: str = Field(..., description="low, medium, high")
    confidence: float = Field(..., ge=0.0, le=1.0)
    price_estimate: Dict[str, int]
    recommendations: List[str]
    reasoning: str


class PriceEstimator:
    """価格見積もりエンジン"""

    BASE_PRICE = 8800
    REPORT_FEE = 3000

    @classmethod
    def calculate(cls, symptoms: Symptoms, urgency: str) -> Dict[str, int]:
        """
        症状と緊急度から価格を計算

        料金構成:
        - 基本料金: 8,800円
        - 測定料金: 時間により変動
        - レポート作成料: 3,000円
        - 緊急対応料金: 5,000円
        """
        base = cls.BASE_PRICE
        measurement_fee = 0
        report_fee = cls.REPORT_FEE
        urgency_fee = 0

        # 測定時間による加算
        if symptoms.time_of_day == "night":
            measurement_fee = 8000  # 夜間測定
        elif symptoms.duration_weeks and symptoms.duration_weeks > 4:
            measurement_fee = 15000  # 長期測定が必要
        else:
            measurement_fee = 5000  # 標準測定

        # 緊急対応料金
        if urgency == "high":
            urgency_fee = 5000

        min_price = base + measurement_fee + report_fee + urgency_fee
        max_price = min_price + 5000  # 追加測定の可能性

        return {
            "min": min_price,
            "max": max_price,
            "breakdown": {
                "base": base,
                "measurement": measurement_fee,
                "report": report_fee,
                "urgency": urgency_fee
            }
        }


class DiagnosisEngine:
    """AI診断エンジン"""

    URGENCY_RULES = {
        # 高緊急度の条件
        "high": [
            lambda s: s.time_of_day == "night" and s.duration_weeks and s.duration_weeks > 2,
            lambda s: s.impact_level == "severe",
            lambda s: s.noise_type == "construction" and s.time_of_day == "night",
            lambda s: s.frequency == "daily" and s.time_of_day == "night"
        ],
        # 中緊急度の条件
        "medium": [
            lambda s: s.duration_weeks and s.duration_weeks > 1,
            lambda s: s.frequency == "daily",
            lambda s: s.noise_type in ["footsteps", "music", "voice"]
        ]
    }

    LEGAL_RISK_RULES = {
        # 高リスク（受忍限度超過の可能性）
        "high": [
            lambda s: s.time_of_day == "night" and s.frequency == "daily",
            lambda s: s.duration_weeks and s.duration_weeks >= 4,
            lambda s: s.contacted_management and s.duration_weeks and s.duration_weeks > 2
        ],
        # 中リスク
        "medium": [
            lambda s: s.time_of_day == "night",
            lambda s: s.duration_weeks and s.duration_weeks >= 2,
            lambda s: s.noise_type in ["music", "construction"]
        ]
    }

    @classmethod
    def assess_urgency(cls, symptoms: Symptoms) -> str:
        """緊急度を判定"""
        # 高緊急度チェック
        for rule in cls.URGENCY_RULES["high"]:
            try:
                if rule(symptoms):
                    return "high"
            except:
                pass

        # 中緊急度チェック
        for rule in cls.URGENCY_RULES["medium"]:
            try:
                if rule(symptoms):
                    return "medium"
            except:
                pass

        return "low"

    @classmethod
    def assess_legal_risk(cls, symptoms: Symptoms) -> str:
        """法的リスクを評価"""
        # 高リスクチェック
        for rule in cls.LEGAL_RISK_RULES["high"]:
            try:
                if rule(symptoms):
                    return "high"
            except:
                pass

        # 中リスクチェック
        for rule in cls.LEGAL_RISK_RULES["medium"]:
            try:
                if rule(symptoms):
                    return "medium"
            except:
                pass

        return "low"

    @classmethod
    async def generate_recommendations(
        cls,
        symptoms: Symptoms,
        urgency: str,
        legal_risk: str
    ) -> List[str]:
        """GPT-4で対策提案を生成"""

        prompt = f"""以下の騒音トラブルについて、具体的な対策を3-5個提案してください。

【症状】
- 騒音タイプ: {symptoms.noise_type or '不明'}
- 発生時間: {symptoms.time_of_day or '不明'}
- 継続期間: {symptoms.duration_weeks or '不明'}週間
- 発生源: {symptoms.source_location or '不明'}
- 管理会社への相談: {'済み' if symptoms.contacted_management else '未'}

【評価】
- 緊急度: {urgency}
- 法的リスク: {legal_risk}

【提案形式】
1. 短期対策（すぐできること）
2. 中期対策（1-2週間で実施）
3. 長期対策（必要に応じて）

各提案は1文で簡潔に。"""

        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "あなたは騒音トラブル解決の専門家です。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )

            recommendations_text = response.choices[0].message.content

            # 番号付きリストを配列に変換
            recommendations = []
            for line in recommendations_text.split('\n'):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-')):
                    # 先頭の番号や記号を削除
                    clean_line = line.lstrip('0123456789.-) ').strip()
                    if clean_line:
                        recommendations.append(clean_line)

            return recommendations

        except Exception as e:
            # GPT-4呼び出し失敗時のフォールバック
            print(f"GPT-4 error: {e}")
            return cls._fallback_recommendations(urgency, legal_risk)

    @classmethod
    def _fallback_recommendations(cls, urgency: str, legal_risk: str) -> List[str]:
        """GPT-4失敗時のデフォルト提案"""
        recommendations = [
            "騒音の発生時間と内容を記録する（日時、音の種類、大きさ）",
            "管理会社に正式に文書で申し入れを行う"
        ]

        if urgency in ["medium", "high"]:
            recommendations.append("専門業者による騒音測定を実施し、客観的データを取得する")

        if legal_risk == "high":
            recommendations.append("測定結果をもとに弁護士に相談し、法的対応を検討する")

        return recommendations


@app.post("/api/internal/diagnose", response_model=DiagnosisResponse)
async def diagnose(request: DiagnosisRequest):
    """
    AI診断実行

    症状から以下を判定:
    - 騒音タイプの推定
    - 緊急度
    - 法的リスク
    - 価格見積もり
    - 対策提案
    """
    try:
        symptoms = request.symptoms

        # 緊急度判定
        urgency = DiagnosisEngine.assess_urgency(symptoms)

        # 法的リスク評価
        legal_risk = DiagnosisEngine.assess_legal_risk(symptoms)

        # 価格見積もり
        price_estimate = PriceEstimator.calculate(symptoms, urgency)

        # 対策提案生成
        recommendations = await DiagnosisEngine.generate_recommendations(
            symptoms,
            urgency,
            legal_risk
        )

        # 信頼度計算（情報の充実度）
        confidence = calculate_confidence(symptoms)

        # 推論理由生成
        reasoning = generate_reasoning(symptoms, urgency, legal_risk)

        # 診断IDを生成
        diagnosis_id = f"diag-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        return DiagnosisResponse(
            diagnosis_id=diagnosis_id,
            noise_type=symptoms.noise_type or "unknown",
            urgency=urgency,
            legal_risk=legal_risk,
            confidence=confidence,
            price_estimate=price_estimate,
            recommendations=recommendations,
            reasoning=reasoning
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_confidence(symptoms: Symptoms) -> float:
    """
    診断の信頼度を計算

    入力情報の充実度に基づいて0.0-1.0の値を返す
    """
    fields = [
        symptoms.noise_type,
        symptoms.time_of_day,
        symptoms.duration_weeks,
        symptoms.frequency,
        symptoms.source_location
    ]

    filled_count = sum(1 for field in fields if field is not None)
    base_confidence = filled_count / len(fields)

    # 詳細な説明文がある場合はボーナス
    if symptoms.description and len(symptoms.description) > 50:
        base_confidence = min(1.0, base_confidence + 0.1)

    return round(base_confidence, 2)


def generate_reasoning(symptoms: Symptoms, urgency: str, legal_risk: str) -> str:
    """診断理由を生成"""
    reasons = []

    if urgency == "high":
        reasons.append("夜間の継続的な騒音のため、緊急度が高いと判断しました。")
    elif urgency == "medium":
        reasons.append("一定期間継続しているため、中程度の緊急度と判断しました。")

    if legal_risk == "high":
        reasons.append(
            "環境基準超過の可能性が高く、法的措置の対象となる可能性があります。"
        )
    elif legal_risk == "medium":
        reasons.append("状況によっては受忍限度を超える可能性があります。")

    if symptoms.time_of_day == "night":
        reasons.append("夜間（22時〜翌6時）は環境基準が45dBと厳しくなります。")

    if not reasons:
        reasons.append("提供された情報から総合的に判断しました。")

    return " ".join(reasons)


@app.get("/health")
def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "service": "ai-diagnosis-service"}


@app.get("/ready")
def readiness_check():
    """レディネスチェック"""
    try:
        # OpenAI APIの接続確認
        if not openai.api_key:
            raise Exception("OpenAI API key not configured")

        return {
            "status": "ready",
            "openai": "configured"
        }
    except Exception as e:
        return {
            "status": "not ready",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
