import { cash, delta, later, mod, news, spawn, untag } from './ops.js';

// [home, destination, service knob, pressure, headline, setup, local action,
//  linked headline, linked response]. Negative values cut supply, positive ones raise demand.
const incidents = [
  ['CN','DC','commuteCap',-7,'Xe ca đỗ nhầm bến','Công nhân đứng chờ ở cổng cũ, xe lại tới cổng mới.','Dán lại biển và điều xe','Bến khu dân cư đông nghẹt','Gom khách theo cụm'],
  ['CN','CB','cnExport',9,'Đơn quạt máy tới dồn dập','Trời nóng, các cửa hàng gọi thêm quạt cùng một lúc.','Chia đơn theo chuyến','Quạt xếp kín cửa kho','Đặt lịch nhận hàng'],
  ['CN','TT','plant',-9,'Quạt mát trạm điện đứng hình','Bộ quạt giải nhiệt cần thay trước ca tối.','Đổi bộ quạt dự phòng','Trung tâm phải chia giờ dùng điện','Dời tải khỏi giờ cao điểm'],
  ['CN','DC','commuters',8,'Ca đêm đổi giờ','Lịch mới khiến nhiều người tan ca sau chuyến xe cuối.','Khớp giờ ca với tuyến xe','Chuyến cuối không đón kịp công nhân','Bổ sung xe đón muộn'],
  ['CN','CB','portCap',-8,'Pallet vỡ giữa sân','Xe chở hàng cần bốc lại cả lô trước khi ra bến.','Đổi pallet tại xưởng','Hàng lỡ lượt lên tàu','Đổi thứ tự bốc hàng'],
  ['CN','NN','foodNeed',5,'Xưởng mở thêm căng tin','Đơn đặt rau tăng đột ngột khi xưởng mở thêm ca.','Chốt thực đơn theo lượng rau','Ruộng chưa kịp gom đủ rau','Gom hàng từ nhiều ruộng'],
  ['CN','TT','healthNeed',8,'Khói cay từ lò sấy','Một mẻ sấy lỗi làm cả ca phải ra ngoài kiểm tra sức khỏe.','Dừng lò và thông gió','Phòng khám đông sau ca xưởng','Mở thêm bàn tiếp nhận'],
  ['CN','CB','compImport',8,'Thiếu đúng một loại ốc','Lô linh kiện mới thiếu ốc đúng cỡ cho dây chuyền.','Chia sẻ ốc giữa các xưởng','Bến phải tìm kiện ốc gấp','Ưu tiên kiện linh kiện nhỏ'],
  ['CN','DC','housingNeed',8,'Đội lắp máy tìm phòng','Kỹ thuật viên tới trước khi chỗ ở được chuẩn bị.','Sắp phòng theo đợt','Phòng trống hết sạch gần xưởng','Mở chỗ ở ngắn ngày'],
  ['CN','VC','pwDem.CN',9,'Lò gốm tranh giờ bật máy','Hai mẻ nung cùng bắt đầu, tải điện tăng vọt.','Xếp ca nung lệch giờ','Nguồn điện từ hồ bị kéo căng','Thỏa thuận khung tải với xưởng'],

  ['NN','CB','nnExport',9,'Bí ngô lăn đầy sân','Vụ bí bất ngờ được mùa, sân gom không còn chỗ.','Chia ngày đưa bí ra bến','Bến chật vì xe bí','Mở ca nhận nông sản'],
  ['NN','DC','food',-6,'Rau lá héo giữa trưa','Xe lấy rau tới muộn đúng lúc nắng lên.','Gom rau vào kho mát','Quầy rau vắng hàng','Đổi lịch giao buổi sớm'],
  ['NN','VC','wDem.NN',8,'Ruộng mạ xin thêm nước','Các ruộng gieo cùng ngày nên cùng mở cống.','Chia lượt mở cống','Bản Mây phải chia lượt xả hồ','Xếp lịch cấp nước'],
  ['NN','CB','roadNNCB',-9,'Xe dưa kẹt đường làng','Một xe lớn mắc ngay chỗ cua ra đường chính.','Dùng xe nhỏ trung chuyển','Dưa trễ chuyến ở cảng','Giữ chỗ cho lô dưa'],
  ['NN','DC','roadNNDC',-6,'Sạp trứng chờ mãi','Mặt đường từ trại tới chợ đang bị ngập.','Chuyển trứng qua đường cao','Chợ thiếu trứng buổi sáng','Gộp chuyến qua tuyến cao'],
  ['NN','TT','healthNeed',7,'Ong kéo đàn ra đường','Đàn ong bị động lúc chuyển tổ, đường vào chợ phải tạm tránh.','Nhờ người nuôi chuyển đàn','Trạm y tế chuẩn bị đón người bị đốt','Mở điểm hỗ trợ gần chợ'],
  ['NN','CN','pwDem.NN',7,'Máy sấy cùng bật một lúc','Mưa vừa ngớt, các kho đều chạy máy sấy để giữ thóc.','Luân phiên chạy máy sấy','Xưởng phải đổi lịch dùng điện','Dời máy nặng sang ca sau'],
  ['NN','CB','storage',-6,'Thùng dâu thiếu đá','Kho gom không còn đá cho chuyến dâu cuối.','Chia đá cho lô dễ hỏng','Dâu cần một góc kho mát','Dọn kho cho hàng tươi'],
  ['NN','DC','foodNeed',7,'Cơn sốt bánh khoai','Một quầy bánh nổi tiếng khiến hàng khoai bán hết từ sáng.','Đặt phần khoai cho chợ dân sinh','Chợ khu ở phải tìm khoai thêm','Chia giờ nhận khoai'],
  ['NN','VC','roadTTVC',-4,'Đoàn xe giống đi đường vòng','Tuyến giao cây giống đổi sang đường lên bản vì cầu đang sửa.','Chia xe giống thành tốp','Xe khách phải nhường đường lên bản','Tách khung giờ xe khách'],

  ['TT','DC','careCap',-7,'Nhà trẻ nghỉ sửa mái','Mưa dột vào hai phòng, phụ huynh phải đổi chỗ gửi trẻ.','Mượn phòng học trống','Điểm giữ trẻ khu ở quá tải','Mở nhóm trông trẻ tạm'],
  ['TT','VC','healthCap',-9,'Máy khám đặt sai phòng','Thiết bị mới chưa thể dùng vì phòng chưa đấu điện.','Đấu điện cho phòng khám','Lịch khám từ Bản Mây bị dồn','Đặt lịch khám lưu động'],
  ['TT','CN','bridge',-0.3,'Cầu đông vì kẻ lại vạch','Đội sơn cần một làn trống đúng giờ xe tải qua.','Sơn cầu sau giờ cao điểm','Xe hàng Thiên Hà phải đổi đường','Gom xe theo lượt qua cầu'],
  ['TT','CB','portCap',-8,'Giấy nhận hàng in sai mã','Một loạt giấy mới quét không lên, xe dồn ở chốt.','Sửa mã tại nơi cấp','Xe chờ xác nhận ở bến','Mở bàn kiểm tra tại cảng'],
  ['TT','DC','foodNeed',6,'Phố ẩm thực đông gấp đôi','Hội chợ mở cửa và quầy hàng hết nguyên liệu sớm.','Đặt phần hàng cho chợ thường','Chợ dân cư thiếu hàng chiều','Nhận thêm chuyến hàng nhỏ'],
  ['TT','NN','roadNNDC',-5,'Đường chợ biến thành bãi đỗ','Xe khách đỗ lấn lối giao rau.','Chuyển bãi đỗ ra ngoài','Xe rau ùn trên đường vào chợ','Tách lối giao rau'],
  ['TT','VC','vcTrips',5,'Cả trường muốn đi cắm trại','Nhiều lớp đặt cùng một ngày lên Bản Mây.','Chia lịch tham quan theo lớp','Đường lên bản đông xe đoàn','Chia lượt xe qua bản'],
  ['TT','CN','commuteCap',-7,'Bến trung tâm sửa bảng điện','Tuyến đổi tạm nhưng bảng giờ vẫn hiện lịch cũ.','Cử người chỉ tuyến tại bến','Công nhân lên nhầm tuyến','Treo bảng chỉ đường đến xưởng'],
  ['TT','CB','cnExport',7,'Hội chợ chốt nhiều đơn mẫu','Các gian đặt thêm hàng gửi ngay sau khi đóng cửa.','Gộp mẫu thành lô nhỏ','Kiện mẫu chiếm chỗ ở bến','Gom mẫu vào một chuyến'],
  ['TT','DC','healthNeed',7,'Giải chạy thiếu trạm nước','Nắng lên nhanh, trạm nghỉ không đủ nước.','Mở thêm bàn nước và nghỉ','Trạm khám khu ở cần thêm chỗ','Mở thêm ca hỗ trợ'],

  ['DC','CN','commuters',7,'Chung cư mới đông người đi ca','Hai tòa nhà bàn giao cùng lúc, tuyến xe cũ không đủ chỗ.','Thêm điểm đón quanh khu ở','Cổng xưởng đông người đến muộn','Điều xe đón từ khu ở'],
  ['DC','TT','careNeed',7,'Ngày hội trường trùng ngày làm','Nhiều gia đình cần chỗ trông trẻ cùng buổi.','Chia lịch ngày hội','Nhà trẻ trung tâm hết chỗ','Điều chỗ giữa các lớp'],
  ['DC','NN','foodNeed',6,'Bếp chung đặt cơm gấp','Bếp mới mở và đặt rau cho cả khu cùng lúc.','Đặt hàng theo thực đơn ngày','Ruộng phải chuẩn bị thêm một chuyến','Chia lô theo giờ thu hoạch'],
  ['DC','CN','pwDem.DC',8,'Cả phố bật điều hòa','Đợt nóng đầu mùa đẩy tải điện buổi tối lên cao.','Mở điểm mát dùng chung','Xưởng phải dời mẻ chạy đêm','Dời máy sang khung ít tải'],
  ['DC','TT','healthNeed',8,'Phòng khám khu ở nghỉ đột xuất','Bác sĩ đổi lịch, người chờ chuyển tới trung tâm.','Điều ca khám về khu ở','Sảnh khám trung tâm kín ghế','Mở quầy hẹn theo giờ'],
  ['DC','CB','portLabor',-0.2,'Cảng tăng ca đúng đợt chuyển nhà','Nhiều người bốc hàng đang bận dọn phòng trọ.','Hẹn xe chuyển nhà ngoài giờ ca','Bến thiếu tay bốc kiện','Chia lại ca nhận tàu'],
  ['DC','VC','wDem.DC',7,'Cả dãy phố thử vòi mới','Van mới mở cùng lúc làm nhu cầu tăng.','Kiểm tra vòi theo từng cụm','Hồ phải bù nước cho khu ở','Điều chỉnh lượt cấp nước'],
  ['DC','TT','housingNeed',8,'Khu trọ sửa hành lang','Một dãy trọ phải dời người trong vài ngày.','Bố trí phòng trống cùng khu','Trung tâm thiếu phòng ở tạm','Mở điểm lưu trú ngắn ngày'],
  ['DC','NN','roadNNDC',-6,'Chợ đồ cũ lấn lối xe rau','Gian hàng kéo dài tới cửa nhập hàng.','Dời gian hàng khỏi lối xe','Nông sản chưa vào được chợ','Mở khung giao hàng sớm'],
  ['DC','CN','careCap',-7,'Ca trông trẻ thiếu người','Một ca nghỉ làm nhiều phụ huynh chưa thể tới xưởng.','Bổ sung ca trông tại khu ở','Xưởng thiếu người đầu ca','Khớp lại giờ đón trẻ với ca xưởng'],

  ['VC','NN','waterExtra',-8,'Cành cây kẹt cửa lấy nước','Mưa cuốn cành lớn xuống cửa dẫn vào kênh.','Vớt cành ở cửa lấy nước','Đồng bằng chờ lượt tưới','Mở lượt nước bù'],
  ['VC','CN','hydroMax',-9,'Lưới chắn rác đầy lá','Tổ máy hồ giảm công suất để vệ sinh cửa hút.','Vệ sinh theo từng cửa','Thiên Hà thiếu điện cuối ca','Bù điện cho ca cuối'],
  ['VC','TT','roadTTVC',-5,'Đá nhỏ rơi chắn khúc cua','Xe vẫn qua được nhưng phải chờ từng lượt.','Dọn đá tại khúc cua','Xe khám lưu động bị chậm','Đổi thứ tự chuyến khám'],
  ['VC','DC','food',-6,'Chuyến rau bản lỡ giờ','Xe thu gom đi nhầm đường sau khi đổi biển.','Chốt lại điểm lấy rau','Quầy rau vùng cao trống hàng','Đặt chuyến gom bổ sung'],
  ['VC','CB','nnExport',8,'Mật ong lên đơn lớn','Các nhóm nuôi ong gom được nhiều hàng hơn lịch tàu.','Gom mật theo chuyến nhỏ','Kho cảng chờ thêm chỗ cho mật','Đổi lịch gửi mật'],
  ['VC','TT','vcTrips',5,'Mùa săn mây kín xe','Khách đặt xe lên núi dồn vào một buổi.','Chia giờ lên điểm ngắm','Bến trung tâm ùn khách đi núi','Chia lượt lên xe'],
  ['VC','NN','wDem.VC',6,'Vườn ươm mở rộng luống','Cây con cần tưới nhiều hơn dự tính trong tuần khô.','Tưới theo luống luân phiên','Kênh đồng bằng phải chờ nước','Chia lại lượt tưới ruộng'],
  ['VC','CN','reservePower',-6,'Máy phát dự phòng kẹt đường','Xe chở máy không qua được đoạn dốc ướt.','Chuyển máy sang xe nhẹ','Xưởng phải tìm nguồn dự phòng','Điều máy phát từ kho gần'],
  ['VC','DC','commuteCap',-5,'Xe bản chạy nhầm lịch','Chuyến xuống khu ở khởi hành sớm hơn giờ niêm yết.','Chốt giờ xe với lái xe','Bến khu ở phải đón thêm khách trễ','Mở chuyến nối tạm'],
  ['VC','CB','roadNNCB',-7,'Xe đá sửa dốc đi vòng','Đội sửa đường đổi tuyến, chồng lên đường xe hàng.','Điều xe đá ngoài giờ giao hàng','Tuyến tới cảng chậm xe','Tách lượt xe vật liệu'],

  ['CB','CN','compImport',8,'Kiện linh kiện nằm sai dãy','Mã kho đúng nhưng lô hàng bị đặt sang dãy bên.','Rà kiện theo số niêm phong','Xưởng phải chờ bộ linh kiện','Ưu tiên giao kiện vừa tìm'],
  ['CB','NN','storage',-7,'Kho mát mất một ngăn','Cửa ngăn kho đóng không kín, hàng mới phải chờ.','Sửa cửa và đổi kệ','Đồng bằng chưa gửi được hàng tươi','Mở điểm giữ lạnh tạm'],
  ['CB','DC','food',-6,'Thuyền cá về trễ','Bến cá đổi lượt cập, chuyến xe chợ phải chạy rỗng.','Khớp lại lượt tàu và xe chợ','Quầy cá khu dân cư thiếu hàng','Gom chuyến cá muộn'],
  ['CB','TT','portCap',-9,'Cẩu hàng kẹt móc','Một cầu bến dừng để kiểm tra an toàn.','Đổi móc và chia việc giữa cầu','Xe giao hàng về trung tâm dồn chuyến','Giãn giờ nhận hàng'],
  ['CB','VC','roadTTVC',-4,'Đoàn chở pin đi nhầm lối','Xe vật tư vòng qua đường núi và làm chậm xe khách.','Đổi lộ trình đoàn xe','Đường lên bản phải chia lượt','Dành khung giờ cho xe khách'],
  ['CB','CN','supplyMul',-0.4,'Hàng nhập xuống thiếu khay','Cảng nhận đủ số kiện nhưng một phần khay chưa xuống.','Đối chiếu và dỡ đúng khay','Xưởng thiếu khay chạy máy','Gom khay dùng chung'],
  ['CB','NN','portCap',-10,'Mưa tạt khu bốc nông sản','Sân hở phải tạm đóng trong lúc kéo bạt.','Chuyển hàng vào cầu có mái','Xe nông sản phải chờ ngoài bến','Giãn giờ đưa hàng ra cảng'],
  ['CB','DC','portLabor',-0.25,'Hai tàu cùng xin bốc gấp','Lịch mới cần nhiều người làm hơn trong buổi tối.','Thương lượng dời một tàu','Khu ở cần thêm chuyến đưa người đi ca','Chia ca và gom tuyến xe'],
  ['CB','TT','pwDem.CB',7,'Dãy kho lạnh bật lại','Sau bảo trì, các kho cùng kéo điện để hạ nhiệt.','Bật lần lượt từng kho','Trung tâm phải giữ điện cho phòng khám','Giãn tải thiết bị không thiết yếu'],
  ['CB','VC','portCap',-8,'Vật tư lên bản chưa xuống tàu','Kiện ống nước bị kẹp sau lô hàng cồng kềnh.','Đổi lượt dỡ kiện ống','Bản Mây chậm nhận ống nước','Điều chuyến chở vật tư riêng'],
];

const regionNames = { CN: 'Thiên Hà', NN: 'Đồng bằng', TT: 'Trung tâm', DC: 'Khu dân cư', VC: 'Bản Mây', CB: 'Cảng' };
const pressureOp = (key, amount, n, tag) => Math.abs(amount) < 1
  ? mod(key, 1 + amount, n, 'mul', { tag })
  : mod(key, amount, n, 'add', { tag });
const needKey = /Need$|^wDem\.|^pwDem\.|^commuters$|^portWorkers$|Export$|^compImport$|^vcTrips$/;

export const EXPANDED_EVENTS = [];
export const LINKED_EVENTS = [];
for (const [i, [region, to, key, pressure, title, text, fix, linkedTitle, linkedFix]] of incidents.entries()) {
  const id = `RV${i + 29}`;
  const child = `LV${i + 29}`;
  const local = `${id}:local`;
  const spill = `${id}:spill`;
  const demand = needKey.test(key);
  const severity = i % 5 === 0 ? 2 : 1;
  const game = ['route', 'cargo', 'switches'][i % 3];
  const link = { from: region, to, kind: 'risk', label: linkedTitle };
  const follow = later(1, [spawn(child)]);
  EXPANDED_EVENTS.push({
    id, region, family: id, title, text, origin: 'random', severity, weight: 1.2, deadline: severity,
    affects: [region, to], links: [link],
    eligible: (c) => c.period < c.total,
    onOpen: [pressureOp(key, pressure, 2, local)],
    options: [
      { id: 'A', label: fix, cost: 4 + severity, minigame: game,
        preview: `Xử lý ngay tại chỗ và tránh việc dồn sang ${regionNames[to]}.`,
        now: [untag(local), delta(region, 'access', 2)] },
      { id: 'B', label: 'Chuyển tải sang vùng bên', cost: 2, minigame: game,
        requires: { if: (c) => c.period < c.total, reason: 'Đã đến kỳ cuối, không thể chuyển việc sang kỳ sau' },
        preview: `Hạ áp lực ở đây ngay. ${regionNames[to]} sẽ có việc mới kỳ tới.`,
        now: [untag(local), follow] },
    ],
    wait: `Vùng này chịu thiệt và ${regionNames[to]} nhận thêm việc sau hạn chót.`,
    onExpire: [delta(region, demand ? 'wellbeing' : 'output', -2 * severity), follow],
  });
  LINKED_EVENTS.push({
    id: child, region: to, family: child, title: linkedTitle, origin: 'consequence', severity, deadline: 1,
    text: `Việc từ ${regionNames[region]} dồn sang đây. Có thể dọn ngay hoặc chịu gián đoạn thêm một kỳ.`,
    affects: [region, to], links: [{ ...link, kind: 'active' }],
    onOpen: [pressureOp(key, pressure, 2, spill), delta(to, 'access', -severity)],
    options: [
      { id: 'A', label: linkedFix, cost: 3, minigame: game, preview: 'Gỡ áp lực ngay và mở lại luồng phục vụ.',
        now: [untag(spill), delta(to, 'access', severity + 1)] },
      { id: 'B', label: 'Chạy tạm một kỳ', cost: 1, delay: 1, preview: 'Rẻ hơn, nhưng tình trạng quá tải kéo dài tới kỳ sau.',
        done: [untag(spill), news('Đội hỗ trợ đã bắt kịp phần việc dồn', 'good')] },
      { id: 'C', label: 'Giảm công suất có kế hoạch', cost: 0, preview: 'Giữ ngân sách, đổi lại sản lượng giảm.',
        now: [untag(spill), delta(to, 'output', -3)] },
    ],
    wait: 'Kéo dài gián đoạn, mất thêm sản lượng và tiền khắc phục.',
    onExpire: [delta(to, 'output', -2), cash(-1)],
  });
}
