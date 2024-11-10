const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
let currentWeekStart = new Date();
let selectedDate = null;

const holidays = {
    2024: [
        '2024-01-01', // Año Nuevo
        '2024-01-06', // Reyes
        '2024-03-29', // Viernes Santo
        '2024-04-01', // Lunes de Pascua
        '2024-05-01', // Día del Trabajo
        '2024-06-24', // San Juan
        '2024-08-15', // Asunción
        '2024-09-11', // Diada
        '2024-09-24', // La Mercè
        '2024-10-12', // Hispanidad
        '2024-11-01', // Todos los Santos
        '2024-12-06', // Constitución
        '2024-12-25', // Navidad
        '2024-12-26'  // San Esteban
    ],
    2025: [
        '2025-01-01', // Año Nuevo
        '2025-01-06', // Reyes
        '2025-04-18', // Viernes Santo
        '2025-04-21', // Lunes de Pascua
        '2025-05-01', // Día del Trabajo
        '2025-06-24', // San Juan
        '2025-08-15', // Asunción
        '2025-09-11', // Diada
        '2025-09-24', // La Mercè
        '2025-10-12', // Hispanidad
        '2025-11-01', // Todos los Santos
        '2025-12-06', // Constitución
        '2025-12-25', // Navidad
        '2025-12-26'  // San Esteban
    ]
};

function isHoliday(date) {
    const year = date.getFullYear();
    const dateString = date.toISOString().split('T')[0];
    return holidays[year]?.includes(dateString) || false;
}

function getWeekDates(startDate) {
    const dates = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Comenzar en lunes
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
    }
    return dates;
}

function formatDateRange(dates) {
    const start = dates[0];
    const end = dates[dates.length - 1];
    const options = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
}

function calculateHours(startTime, endTime) {
    let start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
        end = new Date(`2000-01-02T${endTime}`);
    }

    const diffHours = (end - start) / (1000 * 60 * 60);
    
    let dayHours = 0;
    let nightHours = 0;
    
    const dayStart = new Date(`2000-01-01T08:00`);
    const dayEnd = new Date(`2000-01-01T22:00`);
    
    if (start >= dayStart && end <= dayEnd) {
        dayHours = diffHours;
    } else if ((start < dayStart || start >= dayEnd) && 
               (end <= dayStart || end > dayEnd)) {
        nightHours = diffHours;
    } else {
        const effectiveStart = start < dayStart ? dayStart : start;
        const effectiveEnd = end > dayEnd ? dayEnd : end;
        
        if (effectiveEnd > effectiveStart) {
            dayHours = (effectiveEnd - effectiveStart) / (1000 * 60 * 60);
            nightHours = diffHours - dayHours;
        } else {
            nightHours = diffHours;
        }
    }
    
    return { dayHours, nightHours };
}

function saveRates(type) {
    const value = document.getElementById(`rate-${type}`).value;
    localStorage.setItem(`rate-${type}`, value);
    updateShifts();
}

function calculateTotalMoney(day, night, holiday, sunday) {
    return (
        day * (parseFloat(localStorage.getItem('rate-day')) || 10) +
        night * (parseFloat(localStorage.getItem('rate-night')) || 15) +
        holiday * (parseFloat(localStorage.getItem('rate-holiday')) || 20) +
        sunday * (parseFloat(localStorage.getItem('rate-sunday')) || 20)
    );
}

function updateShifts() {
    const dates = getWeekDates(currentWeekStart);
    document.getElementById('date-range').textContent = formatDateRange(dates);
    const container = document.getElementById('shifts-container');
    container.innerHTML = '';

    let totalDay = 0;
    let totalNight = 0;
    let totalHoliday = 0;
    let totalSunday = 0;

    dates.forEach(date => {
        const isSunday = date.getDay() === 0;
        const isHolidayDate = isHoliday(date);
        const isWeekend = isSunday || isHolidayDate;
        const shift = document.createElement('div');
        shift.className = 'shift-card';
        shift.onclick = () => openModal(date);

        const stored = localStorage.getItem(date.toISOString().split('T')[0]);
        const shiftData = stored ? JSON.parse(stored) : null;
        const isFreeDay = shiftData?.freeDay || false;

        if (!isFreeDay && shiftData) {
            const hours = calculateHours(shiftData.start, shiftData.end);
            const totalHours = hours.dayHours + hours.nightHours;

            if (isSunday) {
                totalSunday += totalHours;
            } else if (isHolidayDate) {
                totalHoliday += totalHours;
            } else {
                totalDay += hours.dayHours;
                totalNight += hours.nightHours;
            }
        }

        shift.innerHTML = `
            <div class="date-box ${isWeekend ? 'weekend' : ''}">
                <div class="day-number">${date.getDate()}</div>
                <div class="day-name">${daysOfWeek[date.getDay()]}</div>
            </div>
            <div class="shift-details">
                ${isFreeDay ? 
                    '<div class="shift-time">Día libre</div>' : 
                    shiftData ? 
                        `<div class="shift-time">${shiftData.start} - ${shiftData.end}</div>` :
                        '<div class="shift-time">Sin horario</div>'
                }
            </div>
        `;

        container.appendChild(shift);
    });

    // Agregar tarjeta de totales
    const totalsCard = document.createElement('div');
    totalsCard.className = 'shift-card totals-card';
    totalsCard.innerHTML = `
        <div style="width: 100%;">
            <div class="totals-row">
                <span class="total-label">Horas diurnas:</span>
                <span class="total-value">${totalDay.toFixed(1)}h</span>
                <input type="number" class="rate-input" id="rate-day" 
                    value="${localStorage.getItem('rate-day') || '10'}" 
                    onchange="saveRates('day')" placeholder="€/h">
                <span class="money-earned">€${(totalDay * (parseFloat(localStorage.getItem('rate-day')) || 10)).toFixed(2)}</span>
            </div>
            <div class="totals-row">
                <span class="total-label">Horas nocturnas:</span>
                <span class="total-value">${totalNight.toFixed(1)}h</span>
                <input type="number" class="rate-input" id="rate-night" 
                    value="${localStorage.getItem('rate-night') || '15'}" 
                    onchange="saveRates('night')" placeholder="€/h">
                <span class="money-earned">€${(totalNight * (parseFloat(localStorage.getItem('rate-night')) || 15)).toFixed(2)}</span>
            </div>
            <div class="totals-row">
                <span class="total-label">Horas festivas:</span>
                <span class="total-value">${totalHoliday.toFixed(1)}h</span>
                <input type="number" class="rate-input" id="rate-holiday" 
                    value="${localStorage.getItem('rate-holiday') || '20'}" 
                    onchange="saveRates('holiday')" placeholder="€/h">
                <span class="money-earned">€${(totalHoliday * (parseFloat(localStorage.getItem('rate-holiday')) || 20)).toFixed(2)}</span>
            </div>
            <div class="totals-row">
                <span class="total-label">Horas domingos:</span>
                <span class="total-value">${totalSunday.toFixed(1)}h</span>
                <input type="number" class="rate-input" id="rate-sunday" 
                    value="${localStorage.getItem('rate-sunday') || '20'}" 
                    onchange="saveRates('sunday')" placeholder="€/h">
                <span class="money-earned">€${(totalSunday * (parseFloat(localStorage.getItem('rate-sunday')) || 20)).toFixed(2)}</span>
            </div>
            <div class="totals-row total-final">
                <span class="total-label">Total:</span>
                <span class="total-value">${(totalDay + totalNight + totalHoliday + totalSunday).toFixed(1)}h</span>
                <span class="money-earned">€${calculateTotalMoney(totalDay, totalNight, totalHoliday, totalSunday).toFixed(2)}</span>
            </div>
        </div>
    `;
    container.appendChild(totalsCard);
}

function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateShifts();
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    updateShifts();
}

function openModal(date) {
    selectedDate = date;
    const modal = document.getElementById('shift-modal');
    const stored = localStorage.getItem(date.toISOString().split('T')[0]);
    const shiftData = stored ? JSON.parse(stored) : null;

    document.getElementById('start-time').value = shiftData?.start || '';
    document.getElementById('end-time').value = shiftData?.end || '';
    document.getElementById('free-day-toggle').checked = shiftData?.freeDay || false;

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('shift-modal').style.display = 'none';
}

function saveShift() {
    if (selectedDate) {
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const isFreeDay = document.getElementById('free-day-toggle').checked;

        const shiftData = {
            start: startTime,
            end: endTime,
            freeDay: isFreeDay
        };

        localStorage.setItem(
            selectedDate.toISOString().split('T')[0],
            JSON.stringify(shiftData)
        );

        closeModal();
        updateShifts();
    }
}

// Inicializar
updateShifts();