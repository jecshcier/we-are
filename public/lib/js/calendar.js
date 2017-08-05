// JavaScript Document


//日历	
$(document).ready(function() {
	
		var date = new Date();
		var d = date.getDate();
		var m = date.getMonth();
		var y = date.getFullYear();
		
		var target_html;
		var newTitle;
		var newHtml;
		var oldTitle;
		//var title;
		
		var calendar = $('#calendar').fullCalendar({
			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,agendaWeek,agendaDay'
			},
			
			buttonText:{
				prev:     '上月',
				next:     '下月',
				prevYear: '去年',
				nextYear: '明年',
				today:    '今天',
				month:    '月',
				week:     '周',
				day:      '日'
			},
			
			titleFormat:{
				month: 'yyyy MMMM'                         // September 2009
				
			},
			
			monthNames:['一月','二月', '三月', '四月', '五月', '六月', '七月','八月', '九月', '十月', '十一月', '十二月'],
			
			dayNames:['星期日', '星期一', '星期二', '星期三','星期四', '星期五', '星期六'],
			
			dayNamesShort:['日', '一', '二', '三', '四', '五', '六'],
			
			allDayText:'今天的任务',
			
			axisFormat:'HH:00',
			
			minTime:8,
			
			maxTime:24,
			
			height:768,
			
			
			
			selectable: true,
			selectHelper: false,
			
			
			
			
			
			 dayClick: function (date, allDay, jsEvent, view) {
				 return false;
			},
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			select: function(start, end, allDay) {
				/**
				$('.inputMess2').show();
				
				$('#modiCancel').click(function(){
					$(this).parent().parent().hide();
				})
				
				$('#modiok').click(function(){
					
					var title = $('#modifyTextarea').val();
				
					if (title) {
						calendar.fullCalendar('renderEvent',
							{
								title: title,
								start: start,
								end: end,
								allDay: allDay
							},
							true // make the event "stick"
						);
						
					}
					$('.inputMess2').hide();
					$('#modifyTextarea').val('');
				})
				**/
				
				var title = prompt('Event Title:');
				
				if (title) {
					calendar.fullCalendar('renderEvent',
						{
							title: title,
							start: start,
							end: end,
							allDay: allDay
						},
						false// make the event "stick"
					);
					
				}
				
				//rerenderEvents.fullCalendar('rerenderEvents');
				
				
				//calendar.fullCalendar('unselect');
				
			},
			editable: true,
			
			
			eventClick: function(calEvent, jsEvent, view) {
				
				/**
				for (var i in jsEvent){
					$('body').prepend('<div style="color:#fff;">'+i + ',' + jsEvent[i]+'</div>')	
				}
				**/
				
				
				
				
				var eventId = calEvent._id;
				
				$(this).attr('id',eventId);
				
				$('.inputMess2').show();	
				
				
				newTitle = calEvent.title;
				
				$('#modifyTextarea').val(newTitle);
				
				newHtml = $(this).children().children('.fc-event-title');
				
				
				
				
				
				
				
				
				
				
				$('#modiok').die().live('click',function(){
					
			
					var newTitle = $('#modifyTextarea').val();
					
					calEvent.title = newTitle;
				
					newHtml.html(newTitle);
					
					$('.inputMess2').hide();
					return false;
				})
				
				
				
				$('#modiCancel').die().live('click',function(){
					$('.inputMess2').hide();	
				})
				
				$('#modidel').die().live('click',function(){
					newHtml.parent().parent().remove();
					$('.inputMess2').hide();
				})
				
				
				
				
				
				
				/**			
				var newTitle = prompt('modify',calEvent.title)
				
				calEvent.title = newTitle;
				$(this).css('border-color', 'red');
				
				
		
				// change the border color just for fun
				if(newTitle == ''){
					alert('请输入内容');	
				}else{
					$(this).children().children('.fc-event-title').html(newTitle);
				}
				**/
				
			},
			
			
			
			
			eventDrop: function(event,dayDelta,minuteDelta,allDay,revertFunc) {

				
				//rerenderEvents.fullCalendar('rerenderEvents');
			
	
			},

			
			
			
			
			
			
			
			
			events: [
			/**
				{
					title: 'All Day Event',
					start: new Date(y, m, 1),
				},


				{
					title: 'Long Event',
					start: new Date(y, m, d-5),
					end: new Date(y, m, d-2)
				},
				{
					id: 999,
					
					title: 'Repeating Event',
					start: new Date(y, m, d-3, 16, 0),
					allDay: false
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: new Date(y, m, d+4, 16, 0),
					allDay: false
				},
				{
					title: 'Meeting',
					start: new Date(y, m, d, 10, 30),
					allDay: false
				},
				{
					title: 'Lunch',
					start: new Date(y, m, d, 12, 0),
					end: new Date(y, m, d, 14, 0),
					allDay: false
				},
				{
					title: 'Birthday Party',
					start: new Date(y, m, d+1, 19, 0),
					end: new Date(y, m, d+1, 22, 30),
					allDay: false
				},
				{
					title: 'Click for Google',
					start: new Date(y, m, 28),
					end: new Date(y, m, 29),
					url: 'http://google.com/'
				}
				**/
			]
		});
		
		
		
		
		
		
		
	});	