#! /usr/bin/env python3

from scapy.layers.inet import traceroute
import json, ipaddress, itertools

def traceroute_scan(target, listipcidras, asnumber):
    as_retrieved = None
    list_return_ip = []
    p, r = traceroute(target)
    if(target in p.get_trace().keys()):
        p = p.get_trace()[target]
        # cette sorcellerie permet de filtrer les IP en commençant par la fin et en retournant que les IP de l'AS
        for k, v in reversed(p.items()):
            ip = ipaddress.IPv4Address(v[0])
            if(ip.is_private):
                list_return_ip.append((v[0], None))
                continue
            else:
                for i in listipcidras:
                    if(ip in i[0]):
                        if(asnumber == i[1]):
                            list_return_ip.append((v[0], i[1]))
                        else:
                            list_return_ip.append((v[0], i[1]))
                            return list_return_ip
        return list_return_ip
    else:
        return None

def traceroute_fuzzing(asnumber, targetcidr):
    with open('asinfo/routeviews-prefix2as-latest.json', 'r') as listcidr:
        listipcidras = [[ipaddress.IPv4Network(i[0]), i[1]] for i in json.loads(listcidr.read())]
        listcidr.close()
        # on passe au scan traceroute
        targethosts = ipaddress.IPv4Network(targetcidr)
        trace_result = []
        slicer = targethosts.num_addresses // 4 # 4 sert de "pas" pour ne prendre que 5 IP au maximum
        if(slicer < 1):
            slicer = 1
        for i in itertools.islice(targethosts, 0, None, slicer): # parcours la range 5 fois via le slicer
            trace_result.append(traceroute_scan(str(i), listipcidras, asnumber))
        return trace_result

