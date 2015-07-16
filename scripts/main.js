
	var colors = [
		{
		 	'color': '#993035',
		 	'colorID': 'red'
		},
		{
		 	'color': '#bf653c',
		 	'colorID': 'orange'
		},
		{
		 	'color': '#e8cd5b',
		 	'colorID': 'yellow'
		},
		{
		 	'color': '#489162',
		 	'colorID': 'green'
		},
		{
		 	'color': '#004181',
		 	'colorID': 'blue'
		},
		{
		 	'color': '#304968',
		 	'colorID': 'indigo'
		},
		{
		 	'color': '#423859',
		 	'colorID': 'violet'
		}  
	];


	var darkShade, lightShade, shadeScale;


	function drawScale(color,scaleDiv,baseDiv){

		darkShade = chroma(color).saturate(),
		lightShade = darkShade.brighten(50),
		shadeScale = chroma.scale([darkShade, lightShade]).domain([0,7]).out('hex');
		
		$('#data-viz li').each(function(i){
			$(scaleDiv).append('<span></span>');
			$(scaleDiv).children('span:last-child').css({ 'background': shadeScale.mode('lab')(i) });

		});
		baseDiv.css({ 'background-color': shadeScale.mode('lab')(0) }).children('p:last-child').empty().append(color);
	
	}

	colors.forEach(function(c){
		drawScale(c.color,$('.sequential-'+c.colorID),$('.data-'+c.colorID));
	});
	
	

