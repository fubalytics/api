
var tagStatsWidget={

	render_player:function(arb_token, user_id){


		var players = fubalytics.find_players_by_arb_token({arb_token:arb_token, user_id:user_id});
		var player = players[0];

		var id = player.id;
		
 		var tags = fubalytics.get_player_statistics({id:id, user_id:user_id});

 		var playerName = player.firstname + " " + player.lastname;
 		tags["name"] = playerName;
        
        return tags;   	
	}
};
