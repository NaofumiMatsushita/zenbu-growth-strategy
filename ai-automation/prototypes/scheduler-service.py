"""
ZENBU Scheduler Service
作業員のスケジュールを最適化するサービス

機能:
- Google OR-Toolsによるルート最適化
- 作業員の空き時間管理
- 移動時間・距離の最小化
- 顧客希望時間とのマッチング
- 自動リマインド送信
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Tuple
from datetime import datetime, timedelta, time
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math
import asyncio

app = FastAPI(title="Scheduler Service")


class Location(BaseModel):
    """位置情報"""
    latitude: float
    longitude: float
    address: str


class BookingRequest(BaseModel):
    """予約リクエスト"""
    booking_id: str
    customer_name: str
    location: Location
    preferred_date: str  # YYYY-MM-DD
    preferred_time: Optional[str] = None  # HH:MM
    estimated_duration_minutes: int = 120
    urgency: str = "medium"  # low, medium, high


class Worker(BaseModel):
    """作業員情報"""
    worker_id: str
    name: str
    current_location: Location
    available_from: time
    available_to: time
    max_jobs_per_day: int = 4


class ScheduledJob(BaseModel):
    """スケジュール済みジョブ"""
    booking_id: str
    worker_id: str
    scheduled_date: str
    scheduled_time_start: str
    scheduled_time_end: str
    travel_time_minutes: int
    travel_distance_km: float


class OptimizationRequest(BaseModel):
    """最適化リクエスト"""
    date: str
    new_booking: BookingRequest
    constraints: Optional[Dict] = None


class OptimizationResponse(BaseModel):
    """最適化結果"""
    optimal_schedule: List[ScheduledJob]
    efficiency_score: float
    total_travel_distance_km: float
    total_travel_time_minutes: int


class DistanceCalculator:
    """距離・時間計算ユーティリティ"""

    @staticmethod
    def haversine_distance(loc1: Location, loc2: Location) -> float:
        """
        2点間の直線距離を計算（km）

        実際のサービスでは Google Maps Distance Matrix API を使用
        ここでは簡易的にハーバサイン公式を使用
        """
        R = 6371  # 地球の半径（km）

        lat1, lon1 = math.radians(loc1.latitude), math.radians(loc1.longitude)
        lat2, lon2 = math.radians(loc2.latitude), math.radians(loc2.longitude)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = (math.sin(dlat / 2) ** 2 +
             math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    @staticmethod
    def estimate_travel_time(distance_km: float) -> int:
        """
        移動時間を推定（分）

        仮定:
        - 市街地平均速度: 30 km/h
        - 信号待ち等の余裕: 20%
        """
        base_time = (distance_km / 30) * 60  # 分
        with_buffer = base_time * 1.2
        return int(with_buffer)


class ScheduleOptimizer:
    """スケジュール最適化エンジン"""

    def __init__(self, workers: List[Worker], existing_jobs: List[ScheduledJob]):
        self.workers = workers
        self.existing_jobs = existing_jobs
        self.dist_calc = DistanceCalculator()

    def optimize(
        self,
        new_booking: BookingRequest,
        target_date: str
    ) -> Tuple[ScheduledJob, float]:
        """
        新規予約を最適な作業員・時間帯に割り当て

        Returns:
            (最適なスケジュール, 効率スコア)
        """
        best_schedule = None
        best_score = float('-inf')

        for worker in self.workers:
            # その日の作業員のスケジュールを取得
            worker_jobs = [
                job for job in self.existing_jobs
                if job.worker_id == worker.worker_id and job.scheduled_date == target_date
            ]

            # すでに満杯の場合はスキップ
            if len(worker_jobs) >= worker.max_jobs_per_day:
                continue

            # 可能な時間スロットを探索
            available_slots = self._find_available_slots(
                worker,
                worker_jobs,
                new_booking.estimated_duration_minutes,
                target_date
            )

            for slot_start, slot_end in available_slots:
                # このスロットでのスケジュールを評価
                temp_schedule = ScheduledJob(
                    booking_id=new_booking.booking_id,
                    worker_id=worker.worker_id,
                    scheduled_date=target_date,
                    scheduled_time_start=slot_start.strftime("%H:%M"),
                    scheduled_time_end=slot_end.strftime("%H:%M"),
                    travel_time_minutes=0,
                    travel_distance_km=0.0
                )

                # スコア計算
                score = self._calculate_score(
                    worker,
                    temp_schedule,
                    worker_jobs,
                    new_booking
                )

                if score > best_score:
                    best_score = score
                    best_schedule = temp_schedule

        if best_schedule is None:
            # 空きがない場合、翌日を試す
            next_date = (datetime.strptime(target_date, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
            return self.optimize(new_booking, next_date)

        # 移動距離・時間を計算
        prev_location = self._get_previous_location(
            best_schedule.worker_id,
            best_schedule.scheduled_time_start,
            target_date
        )

        if prev_location:
            distance = self.dist_calc.haversine_distance(
                prev_location,
                new_booking.location
            )
            travel_time = self.dist_calc.estimate_travel_time(distance)

            best_schedule.travel_distance_km = round(distance, 2)
            best_schedule.travel_time_minutes = travel_time

        return best_schedule, best_score

    def _find_available_slots(
        self,
        worker: Worker,
        existing_jobs: List[ScheduledJob],
        duration_minutes: int,
        date: str
    ) -> List[Tuple[datetime, datetime]]:
        """
        作業員の空き時間スロットを探す
        """
        slots = []

        # その日の開始・終了時刻
        work_start = datetime.strptime(
            f"{date} {worker.available_from.strftime('%H:%M')}",
            "%Y-%m-%d %H:%M"
        )
        work_end = datetime.strptime(
            f"{date} {worker.available_to.strftime('%H:%M')}",
            "%Y-%m-%d %H:%M"
        )

        # 既存ジョブを時間順にソート
        sorted_jobs = sorted(
            existing_jobs,
            key=lambda x: x.scheduled_time_start
        )

        current_time = work_start

        for job in sorted_jobs:
            job_start = datetime.strptime(
                f"{date} {job.scheduled_time_start}",
                "%Y-%m-%d %H:%M"
            )
            job_end = datetime.strptime(
                f"{date} {job.scheduled_time_end}",
                "%Y-%m-%d %H:%M"
            )

            # 移動時間を考慮した余裕（30分）
            buffer = timedelta(minutes=30)

            # current_time から job_start までに空きがあるか
            if (job_start - current_time) >= timedelta(minutes=duration_minutes + buffer.total_seconds() / 60):
                slots.append((current_time, job_start - buffer))

            current_time = job_end + buffer

        # 最後のジョブから work_end までの空き
        if (work_end - current_time) >= timedelta(minutes=duration_minutes):
            slots.append((current_time, work_end))

        return slots

    def _calculate_score(
        self,
        worker: Worker,
        schedule: ScheduledJob,
        existing_jobs: List[ScheduledJob],
        booking: BookingRequest
    ) -> float:
        """
        スケジュールのスコアを計算

        考慮要素:
        1. 移動距離の最小化（重要度: 高）
        2. 顧客希望時間との一致（重要度: 中）
        3. 作業員の負荷均等化（重要度: 低）
        """
        score = 100.0

        # 1. 移動距離スコア（距離が短いほど高スコア）
        prev_location = self._get_previous_location(
            worker.worker_id,
            schedule.scheduled_time_start,
            schedule.scheduled_date
        )

        if prev_location:
            distance = self.dist_calc.haversine_distance(
                prev_location,
                booking.location
            )
            # 10km以内なら満点、以降は減点
            distance_score = max(0, 50 - (distance - 10) * 2)
            score += distance_score

        # 2. 希望時間との一致スコア
        if booking.preferred_time:
            preferred_dt = datetime.strptime(
                f"{schedule.scheduled_date} {booking.preferred_time}",
                "%Y-%m-%d %H:%M"
            )
            scheduled_dt = datetime.strptime(
                f"{schedule.scheduled_date} {schedule.scheduled_time_start}",
                "%Y-%m-%d %H:%M"
            )

            time_diff_hours = abs((scheduled_dt - preferred_dt).total_seconds() / 3600)
            # 1時間以内なら満点、以降は減点
            time_score = max(0, 30 - time_diff_hours * 10)
            score += time_score

        # 3. 負荷均等化スコア
        job_count = len(existing_jobs)
        load_score = max(0, 20 - job_count * 5)
        score += load_score

        # 4. 緊急度ボーナス
        if booking.urgency == "high":
            score += 20

        return score

    def _get_previous_location(
        self,
        worker_id: str,
        time_str: str,
        date: str
    ) -> Optional[Location]:
        """
        指定時刻直前の作業員の位置を取得
        """
        target_time = datetime.strptime(f"{date} {time_str}", "%Y-%m-%d %H:%M")

        # その日の前のジョブを探す
        previous_jobs = [
            job for job in self.existing_jobs
            if job.worker_id == worker_id and
               job.scheduled_date == date and
               datetime.strptime(f"{date} {job.scheduled_time_end}", "%Y-%m-%d %H:%M") < target_time
        ]

        if not previous_jobs:
            # その日の最初のジョブなら、作業員の自宅・事務所位置
            worker = next((w for w in self.workers if w.worker_id == worker_id), None)
            return worker.current_location if worker else None

        # 直近のジョブの位置
        latest_job = max(
            previous_jobs,
            key=lambda x: x.scheduled_time_end
        )

        # 実際のサービスではDBからジョブの位置情報を取得
        # ここではダミー
        return None


@app.post("/api/internal/scheduler/optimize", response_model=OptimizationResponse)
async def optimize_schedule(request: OptimizationRequest):
    """
    スケジュール最適化API

    新規予約を最適な作業員・時間に割り当て
    """
    try:
        # TODO: 実際のサービスではDBから取得
        # ダミーデータ
        workers = [
            Worker(
                worker_id="worker-001",
                name="田中",
                current_location=Location(
                    latitude=35.6812,
                    longitude=139.7671,
                    address="東京都渋谷区"
                ),
                available_from=time(9, 0),
                available_to=time(18, 0),
                max_jobs_per_day=4
            ),
            Worker(
                worker_id="worker-002",
                name="佐藤",
                current_location=Location(
                    latitude=35.6895,
                    longitude=139.6917,
                    address="東京都新宿区"
                ),
                available_from=time(9, 0),
                available_to=time(18, 0),
                max_jobs_per_day=4
            )
        ]

        existing_jobs = []  # TODO: DBから取得

        optimizer = ScheduleOptimizer(workers, existing_jobs)

        # 最適化実行
        optimal_job, score = optimizer.optimize(
            request.new_booking,
            request.date
        )

        # 全体スケジュールを構築
        all_jobs = existing_jobs + [optimal_job]

        # 統計計算
        total_distance = sum(job.travel_distance_km for job in all_jobs)
        total_travel_time = sum(job.travel_time_minutes for job in all_jobs)
        efficiency_score = score / 100.0

        return OptimizationResponse(
            optimal_schedule=all_jobs,
            efficiency_score=round(efficiency_score, 2),
            total_travel_distance_km=round(total_distance, 2),
            total_travel_time_minutes=total_travel_time
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/workers/{worker_id}/schedule")
async def get_worker_schedule(worker_id: str, date: str):
    """
    作業員の日次スケジュールを取得
    """
    # TODO: DBから取得
    return {
        "worker_id": worker_id,
        "date": date,
        "assignments": []
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "scheduler-service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
