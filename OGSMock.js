// OGSMock.js

const joseki_positions_calls = {
    "15081" : [
        {
            "description":"## Empty Goban\n\nInfinite possibilities await!",
            "variation_label":"_","category":"IDEAL","marks":null,"placement":"root",
            "play":".root","contributor":1,"node_id":"15081","comment_count":21,
            "db_locked_down":false,"parent":{"placement":"root","category":"IDEAL",
                "variation_label":"_","node_id":"15081"},"joseki_source":null,"tags":[],
            "next_moves":
                [{"placement":"Q15","category":"IDEAL","variation_label":"5","node_id":"30712"},{"placement":"Q14","category":"IDEAL","variation_label":"6","node_id":"15290"},{"placement":"Q16","category":"IDEAL","variation_label":"1","node_id":"15422"},{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},{"placement":"R17","category":"IDEAL","variation_label":"3","node_id":"31230"},{"placement":"R15","category":"IDEAL","variation_label":"4","node_id":"31394"}
                ],
            "child_count":19011
        },
        {
            "description":"## 3-4 Point\n\nAKA komoku. The 3-4 point favors territory. In this regard, its efficiency is between that of the star and the 3-3 point. Its effectiveness is maximized when the focus is on the corner. Since the 3-4 point is often considered to be the best play for a steady approach to the game, the 3-4 point has been favored by professionals (and AI) over the years. Even so, it lacks the star point's potential for influence and rapid center development. (pp. 6; see also Ishigure Ikuro—In the Beginning, p. 11.)",
            "variation_label":"2","category":"IDEAL","joseki_source_id":130,"marks":"[]",
            "placement":"R16","play":".root.R16",
            "contributor":412892,"node_id":"24140","comment_count":1,
            "db_locked_down":false,
            "parent":
                {"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},
            "joseki_source":{"id":130,"description":"Yilun Yang—Fundamental Principles of Go","url":"https://senseis.xmp.net/?FundamentalPrinciplesOfGo"},
            "tags":[],"next_moves":[{"placement":"Q16","category":"IDEAL","variation_label":"5","node_id":"29425"},{"placement":"pass","category":"IDEAL","variation_label":"8","node_id":"29533"},{"placement":"O17","category":"IDEAL","variation_label":"3","node_id":"29291"},{"placement":"P17","category":"IDEAL","variation_label":"1","node_id":"24146"},{"placement":"P16","category":"IDEAL","variation_label":"2","node_id":"26969"},{"placement":"O16","category":"IDEAL","variation_label":"4","node_id":"29238"}
            ],"child_count":7562
        },
        {
            "description":"## 3-3 Point\n\nAKA san san. A 3-3 stone takes the corner completely in one move, although it is low and has diminished mobility. It is most often used by players who are territorially oriented and prepared for long drawn-out battles. It is often used by White. (p. 7.) \n\nThere's no the rush to play an enclosure or approach as with a stone on the 3-4 point. Rather, both players can bide their time until developments elsewhere make an approach or enclosure appropriate. (Ishigure Ikuro—In the Beginning, pp. 12-13.)",
            "variation_label":"3","category":"IDEAL","joseki_source_id":130,"marks":"[]",
            "placement":"R17","play":".root.R17","contributor":499745,"node_id":"31230","comment_count":0,
            "db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},
            "joseki_source":{"id":130,"description":"Yilun Yang—Fundamental Principles of Go","url":"https://senseis.xmp.net/?FundamentalPrinciplesOfGo"},
            "tags":[],"next_moves":[{"placement":"pass","category":"IDEAL","variation_label":"5","node_id":"31371"},{"placement":"R14","category":"IDEAL","variation_label":"1","node_id":"31350"},{"placement":"Q14","category":"IDEAL","variation_label":"3","node_id":"31333"},{"placement":"R15","category":"IDEAL","variation_label":"4","node_id":"31361"},{"placement":"Q16","category":"IDEAL","variation_label":"2","node_id":"31231"}
            ]
            ,"child_count":154
        },
        {
            "description":"## Tengen\nDwyrin's favourite!\n\nPossible when Black intends to play mirror go. Also note that Black will now win most of corner ladder fights. \n\n\n[Video: Park Jungwhan takes on Tengen](http://www.dwyrin.tv/park-jungwhan-takes-on-tengen)",
            "variation_label":"_","category":"GOOD","marks":"[]","placement":"K10","play":".root.K10",
            "contributor":412892,"node_id":"31381","comment_count":0,"db_locked_down":false,
            "parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},
            "joseki_source":null,"tags":[],"next_moves":[],"child_count":13
        },{
            "description":"##2-2 Point\n\nA weird move. Tenuki is always a best option for White.","variation_label":"_","category":"TRICK","joseki_source_id":78,"marks":"[]","placement":"S18","play":".root.S18","contributor":412892,"node_id":"32221","comment_count":0,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":{"id":78,"description":"Kogo's Joseki Dictionary","url":"https://waterfire.us/joseki.htm"},"tags":[{"id":43,"description":"Black gets the corner","group":1,"seq":0},{"id":70,"description":"White gets sente","group":3,"seq":1}],"next_moves":[],"child_count":57
        },
        {"description":"## 3-6 Point\n\nAKA oomokuhuzashi. This point invites White to take the corner. Its popular usage has not stood the test of time, given the modern emphasis on occupying the corners. It may be considered a remnant of the New Fuseki movement in Japan in the 1930s. ","variation_label":"_",
        "category":"GOOD","joseki_source_id":78,"marks":"[]","placement":"R14","play":".root.R14","contributor":64817,"node_id":"15287","comment_count":0,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":{"id":78,"description":"Kogo's Joseki Dictionary","url":"https://waterfire.us/joseki.htm"},"tags":[],"next_moves":[],"child_count":2
        },
        {"description":"## 4-5 Point\n\nAKA takamoku. The 4-5 point aims at influence. In this respect, the 3-5 point is similar. \n\nThe value of influence is hard for low-ranked players to grasp. As you gain experience in fighting, it becomes more apparent. (p. 36.)\n\n<A:Q17> is traditional and very common.<br>\n<B:R17> is gaining favor.<br>\n<C:R13> approaches from the side.<br>\n<D:P17> avoids confrontation.","variation_label":"5",
        "category":"IDEAL","joseki_source_id":109,"marks":"[{\"label\":\"A\",\"position\":\"Q17\"},{\"label\":\"B\",\"position\":\"R17\"},{\"label\":\"C\",\"position\":\"R13\"},{\"label\":\"D\",\"position\":\"P17\"}]","placement":"Q15","play":".root.Q15","contributor":445315,"node_id":"30712","comment_count":0,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":{"id":109,"description":"Hideo Otake—Opening Theory Made Easy","url":"https://senseis.xmp.net/?OpeningTheoryMadeEasy"},"tags":[],"next_moves":[{"placement":"Q17","category":"IDEAL","variation_label":"1","node_id":"30755"},{"placement":"R17","category":"IDEAL","variation_label":"2","node_id":"30723"},{"placement":"pass","category":"IDEAL","variation_label":"3","node_id":"30718"}],"child_count":521
        },
        {"description":"## 3-5 Point\n\nAKA mokuhazushi. The 3-5 point is not a common opening play. It emphasizes influence and the side. Since it can often support taking a high position, it has more advantages when fighting globally. So it is more suitable to those who prefer a fighting game. (p. 9.)\n\nIts asymmetrical stance invites an early follow-up play—either an enclosure by Black or an approach by White—as did a stone on the 3-4 point. (Ishigure Ikuro—In the Beginning, p. 16.)","variation_label":"4","category":"IDEAL","joseki_source_id":130,"marks":"[]","placement":"R15","play":".root.R15","contributor":445315,"node_id":"31394","comment_count":0,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":{"id":130,"description":"Yilun Yang—Fundamental Principles of Go","url":"https://senseis.xmp.net/?FundamentalPrinciplesOfGo"},"tags":[],"next_moves":[{"placement":"P16","category":"IDEAL","variation_label":"2","node_id":"31408"},{"placement":"pass","category":"IDEAL","variation_label":"4","node_id":"31397"},{"placement":"Q17","category":"IDEAL","variation_label":"1","node_id":"31600"},{"placement":"R17","category":"IDEAL","variation_label":"3","node_id":"31464"}],"child_count":831
        },
        {"description":"## 4-6 Point\n\nAKA otakamoku. This point invites White to take the corner. This point is seldom played as the initial corner point nowadays, given the modern emphasis on occupying the corners. It was an experimental move during the New Fuseki movement in Japan in the 1930s that has been largely discarded in modern times.","variation_label":"6",
        "category":"IDEAL","joseki_source_id":78,"marks":"[]","placement":"Q14","play":".root.Q14","contributor":64817,"node_id":"15290","comment_count":0,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":{"id":78,"description":"Kogo's Joseki Dictionary","url":"https://waterfire.us/joseki.htm"},"tags":[],"next_moves":[{"placement":"pass","category":"IDEAL","variation_label":"4","node_id":"15420"},{"placement":"P17","category":"IDEAL","variation_label":"4","node_id":"15397"},{"placement":"Q17","category":"IDEAL","variation_label":"2","node_id":"15291"},{"placement":"Q16","category":"IDEAL","variation_label":"3","node_id":"15421"},{"placement":"P16","category":"IDEAL","variation_label":"1","node_id":"15404"}],"child_count":131
        },
        {"description":"## 4-4 Point\n\nAKA star point; hoshi. The 4-4 point allows a player to establish a foothold in a corner while also enabling development of influence. \n\nAlthough the 4-4 point favors influence, it is not necessarily inefficient at securing territory. Players should be flexible with this move, ready to adjust their strategy to changing circumstances, at times using it to build influence, at other times going for territory. (p. 10.)","variation_label":"1",
        "category":"IDEAL","joseki_source_id":109,"marks":"[]","placement":"Q16","play":".root.Q16","contributor":412892,"node_id":"15422","comment_count":2,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":{"id":109,"description":"Hideo Otake—Opening Theory Made Easy","url":"https://senseis.xmp.net/?OpeningTheoryMadeEasy"},"tags":[],"next_moves":[{"placement":"R16","category":"IDEAL","variation_label":"3","node_id":"22835"},{"placement":"R17","category":"IDEAL","variation_label":"2","node_id":"20810"},{"placement":"pass","category":"IDEAL","variation_label":"4","node_id":"22997"},{"placement":"R14","category":"IDEAL","variation_label":"1","node_id":"15467"}],"child_count":9526
        },
        {"description":"## 5-5 Point\n\nAKA gonogo. This point stresses influence at the expense of territory. The 5-5 point has not retained popularity because the 4-4 point (hoshi) strikes a better balance between influence and territory. It was experimented with briefly during the New Fuseki movement in Japan in the 1930s.\n\n\n","variation_label":"_",
        "category":"GOOD","joseki_source_id":78,"marks":"[]","placement":"P15","play":".root.P15","contributor":64817,"node_id":"15090","comment_count":0,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":{"id":78,"description":"Kogo's Joseki Dictionary","url":"https://waterfire.us/joseki.htm"},"tags":[{"id":51,"description":"Black gets the centre","group":1,"seq":8}],"next_moves":[],"child_count":196
        },
        {"description":"##Black Hole Point\n[Professional games involving this position](http://ps.waltheri.net/515007)","variation_label":"_",
        "category":"GOOD","marks":"[]","placement":"P13","play":".root.P13","contributor":59112,"node_id":"15082","comment_count":1,"db_locked_down":false,"parent":{"placement":"root",
        "category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":null,"tags":[],"next_moves":[],"child_count":6
        },
        {"description":"Don't pass on the first turn; it's rude.","variation_label":"9","category":"MISTAKE","marks":"[]","placement":"pass","play":".root.pass","contributor":412892,"node_id":"15089","comment_count":0,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":null,"tags":[],"next_moves":[],"child_count":0
        }
    ],
    "24140" : [
        {
            "description":"## 3-4 Point\n\nAKA komoku. The 3-4 point favors territory. In this regard, its efficiency is between that of the star and the 3-3 point. Its effectiveness is maximized when the focus is on the corner. Since the 3-4 point is often considered to be the best play for a steady approach to the game, the 3-4 point has been favored by professionals (and AI) over the years. Even so, it lacks the star point's potential for influence and rapid center development. (pp. 6; see also Ishigure Ikuro—In the Beginning, p. 11.)",
            "variation_label":"2","category":"IDEAL","joseki_source_id":130,"marks":"[]","placement":"R16","play":".root.R16","contributor":412892,"node_id":"24140","comment_count":1,"db_locked_down":false,
            "parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},
            "joseki_source":{"id":130,"description":"Yilun Yang—Fundamental Principles of Go","url":"https://senseis.xmp.net/?FundamentalPrinciplesOfGo"},
            "tags":[],
            "next_moves":[
                {"placement":"Q16","category":"IDEAL","variation_label":"5","node_id":"29425"},
                {"placement":"pass","category":"IDEAL","variation_label":"8","node_id":"29533"},
                {"placement":"O17","category":"IDEAL","variation_label":"3","node_id":"29291"},
                {"placement":"P17","category":"IDEAL","variation_label":"1","node_id":"24146"},
                {"placement":"P16","category":"IDEAL","variation_label":"2","node_id":"26969"},
                {"placement":"O16","category":"IDEAL","variation_label":"4","node_id":"29238"}
            ],"child_count":7562},
        {"description":"","variation_label":"_","category":"IDEAL","joseki_source_id":70,"marks":"[]","placement":"Q4","play":".root.R16.Q4","contributor":64817,"node_id":"24141","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":70,"description":"Traditional","url":""},"tags":[],"next_moves":[],"child_count":4},
        {"description":"## One-Space Low Approach\n\nAKA small knight approach. This is the basic approach move to the 3-4 point and divides the corner between Black and White.\n\nPrior to AlphaGo, a pincer would be expected. However, AI and current professionals prefer 'backing off' with <A:Q14> or <B:Q15> or kicking at **Q17**.","variation_label":"1","category":"IDEAL","joseki_source_id":78,"marks":"[{\"label\":\"A\",\"position\":\"Q14\"},{\"label\":\"B\",\"position\":\"Q15\"}]","placement":"P17","play":".root.R16.P17","contributor":64817,"node_id":"24146","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":78,"description":"Kogo's Joseki Dictionary","url":"https://waterfire.us/joseki.htm"},"tags":[],"next_moves":[{"placement":"M16","category":"IDEAL","variation_label":"3","node_id":"25483"},{"placement":"M17","category":"IDEAL","variation_label":"8","node_id":"26696"},{"placement":"N17","category":"IDEAL","variation_label":"9","node_id":"24800"},{"placement":"L17","category":"IDEAL","variation_label":"4","node_id":"26237"},{"placement":"N16","category":"IDEAL","variation_label":"6","node_id":"25237"},{"placement":"Q15","category":"IDEAL","variation_label":"2","node_id":"24332"},{"placement":"Q17","category":"IDEAL","variation_label":"5","node_id":"24752"},{"placement":"L16","category":"IDEAL","variation_label":"7","node_id":"26581"},{"placement":"Q14","category":"IDEAL","variation_label":"1","node_id":"24149"},{"placement":"pass","category":"IDEAL","variation_label":"_","node_id":"24148"}],"child_count":2949},
        {"description":"## One-Space High Approach\n\nWhen White approaches high, it feels like it is pressing down on Black. This creates obvious influence toward the center. Black must take careful notice. (p. 6.)","variation_label":"2","category":"IDEAL","joseki_source_id":130,"marks":"[]","placement":"P16","play":".root.R16.P16","contributor":64817,"node_id":"26969","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":130,"description":"Yilun Yang—Fundamental Principles of Go","url":"https://senseis.xmp.net/?FundamentalPrinciplesOfGo"},"tags":[],"next_moves":[{"placement":"R14","category":"GOOD","variation_label":"7","node_id":"27954"},{"placement":"M16","category":"IDEAL","variation_label":"4","node_id":"28687"},{"placement":"N17","category":"IDEAL","variation_label":"2","node_id":"28002"},{"placement":"P17","category":"IDEAL","variation_label":"1","node_id":"26982"},{"placement":"P15","category":"GOOD","variation_label":"5","node_id":"27753"},{"placement":"M17","category":"IDEAL","variation_label":"3","node_id":"29106"},{"placement":"N16","category":"GOOD","variation_label":"6","node_id":"29010"}],"child_count":2350},
        {"description":"## Two-Space High Approach\nPlayed for influence.","variation_label":"4","category":"IDEAL","joseki_source_id":70,"marks":"[]","placement":"O16","play":".root.R16.O16","contributor":64817,"node_id":"29238","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":70,"description":"Traditional","url":""},"tags":[],"next_moves":[{"placement":"M17","category":"IDEAL","variation_label":"3","node_id":"29252"},{"placement":"Q14","category":"IDEAL","variation_label":"2","node_id":"29288"},{"placement":"P17","category":"IDEAL","variation_label":"1","node_id":"29290"}],"child_count":60},{"description":"## Large Knight Approach\nThis approach loses out on territory compared to the small knight approach. But it can also reduce the effectiveness of any Black potential on the upper side. (p. 57.)","variation_label":"3","category":"IDEAL","joseki_source_id":130,"marks":"[]","placement":"O17","play":".root.R16.O17","contributor":64817,"node_id":"29291","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":130,"description":"Yilun Yang—Fundamental Principles of Go","url":"https://senseis.xmp.net/?FundamentalPrinciplesOfGo"},"tags":[],"next_moves":[{"placement":"Q17","category":"IDEAL","variation_label":"1","node_id":"29396"},{"placement":"M17","category":"IDEAL","variation_label":"2","node_id":"29365"},{"placement":"P16","category":"IDEAL","variation_label":"3","node_id":"29292"}],"child_count":133},
        {"description":"## Shoulder Hit\nThis invites Black to secure the corner territory and take liberties from the white stone. This can be good or bad depending on the circumstances.","variation_label":"_","category":"GOOD","marks":"[]","placement":"Q17","play":".root.R16.Q17","contributor":64817,"node_id":"29437","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":null,"tags":[],"next_moves":[],"child_count":0},
        {"description":"","variation_label":"_","category":"IDEAL","marks":"[]","placement":"D17","play":".root.R16.D17","contributor":64817,"node_id":"29444","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":null,"tags":[],"next_moves":[],"child_count":17},{"description":"","variation_label":"_","category":"IDEAL","marks":"[]","placement":"D16","play":".root.R16.D16","contributor":64817,"node_id":"29462","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":null,"tags":[],"next_moves":[],"child_count":61},
        {"description":"The first steps in the opening emphasize the corners. When you play a 3-4 stone, in particular, you should waste no time enclosing the corner. This will usually build about ten points of secure territory.\n\nThe value of an enclosure isn't just the points of territory it surrounds. Securing a solid base in the corner makes it easy to develop along either side from the corner.\n\nA corner enclosure generally takes priority over a side extension.","variation_label":"8","category":"IDEAL","joseki_source_id":109,"marks":"[]","placement":"pass","play":".root.R16.pass","contributor":64817,"node_id":"29533","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":109,"description":"Hideo Otake—Opening Theory Made Easy","url":"https://senseis.xmp.net/?OpeningTheoryMadeEasy"},"tags":[],"next_moves":[{"placement":"L17","category":"IDEAL","variation_label":"7","node_id":"30417"},{"placement":"O16","category":"IDEAL","variation_label":"1","node_id":"29537"},{"placement":"P16","category":"IDEAL","variation_label":"2","node_id":"30261"},{"placement":"P17","category":"IDEAL","variation_label":"4","node_id":"30542"},{"placement":"O17","category":"IDEAL","variation_label":"3","node_id":"29781"}],"child_count":1952},
        {"description":"","variation_label":"_","category":"IDEAL","joseki_source_id":70,"marks":"[]","placement":"D4","play":".root.R16.D4","contributor":64817,"node_id":"29524","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":70,"description":"Traditional","url":""},"tags":[],"next_moves":[],"child_count":8},
        {"description":"## Attachment\nThis move functions as a leaning attack, preparing for a fight on the other side.\n\nIf Black resists with <A:Q17>, White's leaning attack might become even more powerful, so Black might want to give in with **B**.<br>\n<B:R17> reverts to <position: 31234>.","variation_label":"5","category":"IDEAL","joseki_source_id":90,"marks":"[{\"label\":\"A\",\"position\":\"Q17\"},{\"label\":\"B\",\"position\":\"R17\"}]","placement":"Q16","play":".root.R16.Q16","contributor":64817,"node_id":"29425","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":90,"description":"James Kerwin","url":"https://senseis.xmp.net/?JamesKerwin"},"tags":[],"next_moves":[{"placement":"R15","category":"IDEAL","variation_label":"2","node_id":"29426"},{"placement":"Q17","category":"IDEAL","variation_label":"1","node_id":"29429"}],"child_count":11},
        {"description":"##Attachment\nUsually played to create a ko threat.\n\nIt is also a special case move to invade the corner when Black has a double wing formation with stones around <X:L17>-<X:Q12>.\n\n<A:Q16> tries to prevent White from creating a very big ko threat<br>\n**Tenuki** right away, ending a ko, is another good option.<br>\n<B:Q17> is good when it is not related to a ko fight.","variation_label":"_","category":"GOOD","joseki_source_id":70,"marks":"[{\"label\":\"X\",\"position\":\"L17\"},{\"label\":\"X\",\"position\":\"Q12\"},{\"label\":\"A\",\"position\":\"Q16\"},{\"label\":\"B\",\"position\":\"Q17\"}]","placement":"R17","play":".root.R16.R17","contributor":64817,"node_id":"29438","comment_count":0,"db_locked_down":false,"parent":{"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},"joseki_source":{"id":70,"description":"Traditional","url":""},"tags":[],"next_moves":[],"child_count":5}
    ]
};
const joseki_position_calls = {
    "15081" : {
        "description":"## Empty Goban\n\nInfinite possibilities await!",
        "variation_label":"_",
        "category":"IDEAL",
        "marks":null,
        "placement":"root","play":".root","contributor":1,"node_id":"15081","comment_count":21,"db_locked_down":false,"parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},"joseki_source":null,"tags":[],
        "next_moves":[
            {"placement":"Q15","category":"IDEAL","variation_label":"5","node_id":"30712"},
            {"placement":"Q14","category":"IDEAL","variation_label":"6","node_id":"15290"},
            {"placement":"Q16","category":"IDEAL","variation_label":"1","node_id":"15422"},
            {"placement":"R16","category":"IDEAL","variation_label":"2","node_id":"24140"},
            {"placement":"R17","category":"IDEAL","variation_label":"3","node_id":"31230"},
            {"placement":"R15","category":"IDEAL","variation_label":"4","node_id":"31394"}
        ],"child_count":19011
    },
    "24140" : {
        "description":"## 3-4 Point\n\nAKA komoku. The 3-4 point favors territory. In this regard, its efficiency is between that of the star and the 3-3 point. Its effectiveness is maximized when the focus is on the corner. Since the 3-4 point is often considered to be the best play for a steady approach to the game, the 3-4 point has been favored by professionals (and AI) over the years. Even so, it lacks the star point's potential for influence and rapid center development. (pp. 6; see also Ishigure Ikuro—In the Beginning, p. 11.)",
        "variation_label":"2",
        "category":"IDEAL",
        "joseki_source_id":130,
        "marks":"[]",
        "placement":"R16",
        "play":".root.R16",
        "contributor":412892,
        "node_id":"24140",
        "comment_count":1,
        "db_locked_down":false,
        "parent":{"placement":"root","category":"IDEAL","variation_label":"_","node_id":"15081"},
        "joseki_source":
            {
                "id":130,"description":"Yilun Yang—Fundamental Principles of Go","url":"https://senseis.xmp.net/?FundamentalPrinciplesOfGo"
            },
        "tags":[],
        "next_moves":[
            {"placement":"Q16","category":"IDEAL","variation_label":"5","node_id":"29425"},
            {"placement":"pass","category":"IDEAL","variation_label":"8","node_id":"29533"},
            {"placement":"O17","category":"IDEAL","variation_label":"3","node_id":"29291"},
            {"placement":"P17","category":"IDEAL","variation_label":"1","node_id":"24146"},
            {"placement":"P16","category":"IDEAL","variation_label":"2","node_id":"26969"},
            {"placement":"O16","category":"IDEAL","variation_label":"4","node_id":"29238"}
        ],"child_count":7562
    }
};

getPosition = (id) => joseki_position_calls[id];
getPositions = (id) => joseki_positions_calls[id];

module.exports = {
  //getOrders:  getOrders,
  getPosition:  getPosition,
  getPositions:  getPositions
}