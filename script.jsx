//i dont know but the first part that is a comment doesnt work and i saved for cheked latter xd 

/*function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendchild(script);
}


loadScript('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js', function(){
    
    document.addEventListener('DOMContentLoaded', function(){
        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar (calendarEl, {
            initialView: 'dayGridMonth',
            events: [
                {title: 'Evento 1', satart: '2024-10-10'},
                {title: 'Evento 2', satart: '2024-10-15', end: '2024-10-17' }
            ]
        });
        calendar.render();
    });
});*/


    // script.js
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback; // Llama a la función de callback cuando el script se carga
    document.head.appendChild(script);
}

// Cargar FullCalendar
loadScript('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js', function() {
    // Este código se ejecutará una vez que FullCalendar se haya cargado
    console.log('FullCalendar se ha cargado');

    // Puedes inicializar el calendario aquí
    document.addEventListener('DOMContentLoaded', function() {
        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            events: [
                { title: 'Evento 1', start: '2024-10-10' },
                { title: 'Evento 2', start: '2024-10-15', end: '2024-10-17' }
            ]
        });
        calendar.render();
    });
});
