function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}


loadScript('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js', function(){
    
    document.addEventListener('DOMContentLoaded', function(){
        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar (calendarEl, {
            initialView: 'dayGridMonth',
            events: [
                {title: 'Evento 1', start: '2024-10-10'},
                {title: 'Evento 2', start: '2024-10-15', end: '2024-10-17' }
            ]
        });
        calendar.render();
    });
});

