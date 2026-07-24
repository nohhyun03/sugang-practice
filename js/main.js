// 영남대학교 수강신청 타이밍 연습 시뮬레이터 JS

// 09:59:55.000 = 35,995,000 ms
// 10:00:00.000 = 36,000,000 ms
const START_SIM_TIME_MS = 35995000;
const TARGET_SIM_TIME_MS = 36000000;

// 7개 과목 프리셋 데이터
const COURSES_DATA = [
    { id: '1111', type: '전공핵심', name: '데이터베이스', credit: '3', professor: '교수A', time: '월09:00-10:15 수10:30-11:45', method: '', passFail: '', gubun: 'N', note: '스마트출결대상강좌', prev: '' },
    { id: '2222', type: '전공선택', name: '데이터분석과머신러닝', credit: '3', professor: '교수B', time: '수15:00-16:15 금15:00-16:15', method: '', passFail: '', gubun: 'N', note: '스마트출결대상강좌', prev: '' },
    { id: '3333', type: '전공핵심', name: '소프트웨어공학', credit: '3', professor: '교수C', time: '금18:00-20:25', method: '', passFail: '', gubun: 'N', note: '스마트출결대상강좌', prev: '' },
    { id: '4444', type: '전공핵심', name: '컴퓨터구조', credit: '3', professor: '교수D', time: '수13:30-14:45 금13:30-14:45', method: '', passFail: '', gubun: 'N', note: '스마트출결대상강좌', prev: '' },
    { id: '5555', type: '전공선택', name: '컴퓨터비전', credit: '3', professor: '교수E', time: '화15:00-16:15 목15:00-16:15', method: '', passFail: '', gubun: 'N', note: '스마트출결대상강좌', prev: '' },
    { id: '6666', type: '전공선택', name: '웹프레임워크', credit: '2', professor: '교수F', time: '목18:00-19:35', method: '블렌디드', passFail: '', gubun: 'N', note: '스마트출결대상강좌', prev: '' },
    { id: '7777', type: '전공선택', name: '클라우드컴퓨팅', credit: '3', professor: '교수G', time: '금10:00-11:50', method: '', passFail: '', gubun: 'N', note: '스마트출결대상강좌', prev: '' }
];

let isTimerRunning = false;
let startRealTime = 0;
let pausedDuration = 0;
let pauseStartTime = 0;
let animationFrameId = null;
let currentSimulatedMs = START_SIM_TIME_MS;
let historyRecords = [];
let isProcessingLag = false;

// 2페이지 수강신청 관리 상태
let appliedCourses = [];
let targetCourseCount = 5;

// DOM 요소 참조
const timerDisplay = document.querySelector('.timer');
const btnStartTest = document.getElementById('btn-start-test');
const btnResetTest = document.getElementById('btn-reset-test');
const selectCourseCount = document.getElementById('course-count');
const selectDelayMode = document.getElementById('delay-mode');
const historyList = document.getElementById('history-list');

const loginView = document.getElementById('view-login');
const sugangView = document.getElementById('view-sugang');
const loginButton = document.querySelector('.loginBtn');
const logoutButton = document.querySelector('.logoutBtn');

// 시간을 HH:MM:SS.mmm 포맷으로 변환
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const mmm = String(milliseconds).padStart(3, '0');

    return `${hh}:${mm}:${ss}.${mmm}`;
}

// 타이머 루프 (requestAnimationFrame 사용)
function updateTimer() {
    if (!isTimerRunning) return;

    const elapsedRealTime = performance.now() - startRealTime - pausedDuration;
    currentSimulatedMs = START_SIM_TIME_MS + elapsedRealTime;

    if (timerDisplay) {
        timerDisplay.textContent = formatTime(currentSimulatedMs);

        if (currentSimulatedMs >= TARGET_SIM_TIME_MS) {
            timerDisplay.classList.add('time-passed');
            timerDisplay.classList.remove('time-approaching');
        } else if (currentSimulatedMs >= TARGET_SIM_TIME_MS - 3000) {
            timerDisplay.classList.add('time-approaching');
        } else {
            timerDisplay.classList.remove('time-approaching', 'time-passed');
        }
    }

    animationFrameId = requestAnimationFrame(updateTimer);
}

// 수강 테이블 초기화 (과목 수 선택 옵션 반영 및 상단 내역 비우기)
function initSugangTables() {
    appliedCourses = [];
    targetCourseCount = selectCourseCount ? parseInt(selectCourseCount.value) : 5;

    const sugangBoxes = document.querySelectorAll('#view-sugang .sugang-box');
    if (sugangBoxes.length < 2) return;

    const topTbody = sugangBoxes[0].querySelector('tbody');
    const bottomTbody = sugangBoxes[1].querySelector('tbody');

    if (topTbody) topTbody.innerHTML = '';
    if (bottomTbody) {
        bottomTbody.innerHTML = '';
        const displayCourses = COURSES_DATA.slice(0, targetCourseCount);

        displayCourses.forEach(course => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a class="plus" data-id="${course.id}" href="#">신청</a></td>
                <td>${course.id}</td>
                <td>${course.type}</td>
                <td class="td-left">${course.name}</td>
                <td>${course.credit}</td>
                <td>${course.professor}</td>
                <td>${course.time}</td>
                <td>${course.method || '&nbsp;'}</td>
                <td>${course.passFail || '&nbsp;'}</td>
                <td>${course.gubun}</td>
                <td class="td-left">${course.note}</td>
                <td>${course.prev || '&nbsp;'}</td>
            `;
            bottomTbody.appendChild(tr);
        });

        // 이벤트 위임으로 "신청" 버튼 클릭 감지
        bottomTbody.onclick = function(e) {
            const target = e.target;
            if (target && target.classList.contains('plus')) {
                e.preventDefault();
                const courseId = target.getAttribute('data-id');
                handleCourseApply(courseId);
            }
        };
    }
}

// 과목 신청 버튼 클릭 시 동작
function handleCourseApply(courseId) {
    if (!courseId) return;

    // 1. 신청 여부 확인 팝업
    const isConfirm = confirm("신청하시겠습니까?");
    if (!isConfirm) return;

    // 2. 중복 신청 검사
    if (appliedCourses.includes(courseId)) {
        alert("이미 신청한 과목입니다.");
        return;
    }

    // 3. 신규 신청 처리
    alert("저장되었습니다.");
    appliedCourses.push(courseId);

    // 상단 수강신청내역 테이블에 행 추가
    const course = COURSES_DATA.find(c => c.id === courseId);
    const sugangBoxes = document.querySelectorAll('#view-sugang .sugang-box');
    if (course && sugangBoxes.length > 0) {
        const topTbody = sugangBoxes[0].querySelector('tbody');
        if (topTbody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a class="minus" href="#">삭제</a></td>
                <td>${course.id}</td>
                <td>${course.type}</td>
                <td class="td-left">${course.name}</td>
                <td>${course.credit}</td>
                <td>${course.professor}</td>
                <td>${course.time}</td>
                <td>${course.method || '&nbsp;'}</td>
                <td>${course.passFail || '&nbsp;'}</td>
                <td>${course.gubun}</td>
                <td class="td-left">${course.note}</td>
                <td>${course.prev || '&nbsp;'}</td>
            `;
            topTbody.appendChild(tr);
        }
    }

    // 4. 모든 목표 과목 신청 완료 판단
    if (appliedCourses.length === targetCourseCount) {
        // 타이머 정지
        isTimerRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        // 최종 기록 계산 및 저장
        const finishRealTime = performance.now();
        const finishSimulatedMs = START_SIM_TIME_MS + (finishRealTime - startRealTime - pausedDuration);
        const diffMs = Math.round(finishSimulatedMs - TARGET_SIM_TIME_MS);

        addHistoryRecord(finishSimulatedMs, diffMs, true);
        alert("🎉 축하합니다! 모든 과목 수강신청을 완료했습니다.");
    }
}

// 테스트 시작
function startTest() {
    isTimerRunning = true;
    startRealTime = performance.now();
    pausedDuration = 0;
    currentSimulatedMs = START_SIM_TIME_MS;
    isProcessingLag = false;

    if (btnStartTest) btnStartTest.disabled = true;
    if (timerDisplay) {
        timerDisplay.classList.remove('time-approaching', 'time-passed');
        timerDisplay.textContent = formatTime(START_SIM_TIME_MS);
    }

    initSugangTables();
    switchView('login');

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(updateTimer);
}

// 테스트 초기화
function resetTest() {
    isTimerRunning = false;
    isProcessingLag = false;
    pausedDuration = 0;

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    currentSimulatedMs = START_SIM_TIME_MS;

    if (timerDisplay) {
        timerDisplay.textContent = formatTime(START_SIM_TIME_MS);
        timerDisplay.classList.remove('time-approaching', 'time-passed');
    }
    if (btnStartTest) btnStartTest.disabled = false;

    initSugangTables();
    switchView('login');
}

// SPA 뷰 전환 (로그인 ↔ 수강신청)
function switchView(targetView) {
    const mainContainer = document.getElementById('main');
    if (targetView === 'sugang') {
        if (loginView) loginView.classList.remove('active');
        if (sugangView) sugangView.classList.add('active');
    } else {
        if (sugangView) sugangView.classList.remove('active');
        if (loginView) loginView.classList.add('active');
    }
    // 페이지 뷰가 전환될 때 항상 메인 영역 스크롤을 최상단으로 리셋
    if (mainContainer) mainContainer.scrollTop = 0;
}

// 로그인 버튼 클릭 처리
function handleLoginSubmit(event) {
    if (event) event.preventDefault();

    if (isProcessingLag) return;

    // START 버튼을 누르지 않았거나 타이머가 정지된 경우
    if (!isTimerRunning && pausedDuration === 0) {
        alert("우측 대시보드의 START 버튼을 먼저 눌러주세요!");
        return;
    }

    const clickRealTime = performance.now();
    const clickSimulatedMs = START_SIM_TIME_MS + (clickRealTime - startRealTime - pausedDuration);
    const diffMs = Math.round(clickSimulatedMs - TARGET_SIM_TIME_MS);

    // 10시 이전 클릭 (실패 케이스)
    if (clickSimulatedMs < TARGET_SIM_TIME_MS) {
        alert("현재 수강신청 기간이 아닙니다.");
        addHistoryRecord(clickSimulatedMs, diffMs, false);
        resetTest();
        return;
    }

    // 10시 이후 클릭 (성공 케이스 - 성공시 기록은 2페이지 완수 시점으로 보류)
    const delayMode = selectDelayMode ? selectDelayMode.value : 'instant';

    if (delayMode === 'lag') {
        // 지연 모드: 타이머 일시정지 후 임의 지연(0.5초 ~ 2.5초) 뒤 보정 없이 재개
        isProcessingLag = true;
        isTimerRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        pauseStartTime = performance.now();

        const randomLagMs = Math.floor(Math.random() * 2000) + 500;

        setTimeout(() => {
            const lagElapsed = performance.now() - pauseStartTime;
            pausedDuration += lagElapsed;
            isProcessingLag = false;

            switchView('sugang');
            isTimerRunning = true;
            animationFrameId = requestAnimationFrame(updateTimer);
        }, randomLagMs);
    } else {
        // 즉시 전환 모드
        switchView('sugang');
    }
}

// 기록 목록에 추가 (ms 수치 표기 전용)
function addHistoryRecord(timeMs, diffMs, isSuccess) {
    const record = {
        timeStr: formatTime(timeMs),
        diffMs: diffMs,
        isSuccess: isSuccess
    };
    historyRecords.unshift(record);
    renderHistory();
}

// 기록 UI 업데이트
function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';

    if (historyRecords.length === 0) {
        historyList.innerHTML = '<li class="empty-history">아직 시도한 기록이 없습니다.</li>';
        return;
    }

    historyRecords.slice(0, 6).forEach((item, index) => {
        const li = document.createElement('li');
        li.className = item.isSuccess ? 'history-item success' : 'history-item fail';

        const diffText = item.isSuccess ? `+${item.diffMs} ms` : `${item.diffMs} ms`;

        li.innerHTML = `
            <span class="hist-index">#${historyRecords.length - index}</span>
            <span class="hist-time">${item.timeStr}</span>
            <span class="hist-diff">${diffText}</span>
        `;
        historyList.appendChild(li);
    });
}

// 이벤트 초기 연결
document.addEventListener('DOMContentLoaded', () => {
    if (timerDisplay) timerDisplay.textContent = formatTime(START_SIM_TIME_MS);

    initSugangTables();

    if (btnStartTest) btnStartTest.addEventListener('click', startTest);
    if (btnResetTest) btnResetTest.addEventListener('click', resetTest);
    if (selectCourseCount) selectCourseCount.addEventListener('change', initSugangTables);

    if (loginButton) loginButton.addEventListener('click', handleLoginSubmit);
    if (logoutButton) logoutButton.addEventListener('click', resetTest);
});